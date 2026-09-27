import { youtubeScraperService, type ScrapedVideo } from '@/data/services/youtube/YouTubeScraperService'

export interface ArtistSongItem {
  videoId: string
  title: string
  thumbnail: string
  artist: string
  duration?: string
  durationSeconds?: number
}

// Expresión regular para detectar compilaciones, mixes largos, álbumes completos y enganchados
const COMPILATION_REGEX = /\b(mix|remix|recopilaci[oó]n|compilation|completo|completa|disco completo|[aá]lbum completo|concierto|full album|greatest hits|grandes [eé]xitos|sus mejores|las mejores|lo mejor de|enganchad[oa]s|1 hora|2 horas|3 horas|24\/7|playlist|setlist|vol\.|volumen)\b/i

/**
 * Convierte un formato de duración "HH:MM:SS" o "MM:SS" a segundos totales.
 */
export const parseDurationToSeconds = (duration?: string | number): number => {
  if (!duration) return 0
  if (typeof duration === 'number') return duration
  if (typeof duration === 'string') {
    const parts = duration.split(':').map(Number)
    if (parts.some(isNaN)) return 0
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 1) return parts[0]
  }
  return 0
}

/**
 * Limpia un título de YouTube para remover sufijos como (Video Oficial), (Audio Oficial), etc.
 */
export const cleanSongTitle = (rawTitle: string): string => {
  return rawTitle
    .replace(/[\(\[](video\s*oficial|official\s*video|audio\s*oficial|official\s*audio|v[ií]deo\s*lyric|lyric\s*video|letra|videoclip|hd|4k|hq)[\)\]]/gi, '')
    .trim()
}

/**
 * Verifica si un video califica como canción individual real de un artista.
 * REGLA DE ORO: Las canciones individuales duran entre 50s y 11min (660s), y no son compilaciones.
 */
export const isIndividualSong = (video: ScrapedVideo): boolean => {
  const title = (video.title || '').toLowerCase()

  // 1. Descartar si el título indica ser un mix, álbum o compilación
  if (COMPILATION_REGEX.test(title)) {
    return false
  }

  // 2. Descartar por duración numérica si está disponible
  const sec = video.durationSeconds || parseDurationToSeconds(video.duration)
  if (sec > 0) {
    if (sec < 50 || sec > 660) {
      // Menor a 50s (shorts/intro) o mayor a 11 minutos (mixes/conciertos)
      return false
    }
  } else if (typeof video.duration === 'string') {
    // Si la duración viene como string con 2 dos puntos (ej: "1:20:45"), supera 1 hora
    if (video.duration.split(':').length >= 3) {
      return false
    }
  }

  return true
}

/**
 * Obtiene pistas y canciones individuales de un artista, garantizando que NO sean mixes ni recopilatorios.
 */
export const getArtistSongs = async (
  artistName: string,
  limit: number = 15
): Promise<ArtistSongItem[]> => {
  const cleanName = artistName.trim()
  if (!cleanName) return []

  try {
    const validSongs: ArtistSongItem[] = []
    const seenIds = new Set<string>()
    const seenTitles = new Set<string>()

    // Búsqueda 1: Canal temático oficial de YouTube Music (Pistas de álbum oficiales)
    const topicQuery = `${cleanName} - Topic`
    const topicResults = await youtubeScraperService.searchWithoutToken(topicQuery)

    for (const v of topicResults) {
      if (isIndividualSong(v) && !seenIds.has(v.videoId)) {
        const cleanTitle = cleanSongTitle(v.title)
        const normTitle = cleanTitle.toLowerCase()
        if (!seenTitles.has(normTitle)) {
          seenIds.add(v.videoId)
          seenTitles.add(normTitle)
          validSongs.push({
            videoId: v.videoId,
            title: cleanTitle || v.title,
            thumbnail: v.thumbnail,
            artist: cleanName,
            duration: v.duration,
            durationSeconds: v.durationSeconds
          })
        }
      }
    }

    // Búsqueda 2: Si obtuvimos menos de 10 canciones, complementar con canciones oficiales
    if (validSongs.length < limit) {
      const complementQuery = `${cleanName} canciones official audio`
      const complementResults = await youtubeScraperService.searchWithoutToken(complementQuery)

      for (const v of complementResults) {
        if (validSongs.length >= limit) break
        if (isIndividualSong(v) && !seenIds.has(v.videoId)) {
          const cleanTitle = cleanSongTitle(v.title)
          const normTitle = cleanTitle.toLowerCase()
          if (!seenTitles.has(normTitle)) {
            seenIds.add(v.videoId)
            seenTitles.add(normTitle)
            validSongs.push({
              videoId: v.videoId,
              title: cleanTitle || v.title,
              thumbnail: v.thumbnail,
              artist: cleanName,
              duration: v.duration,
              durationSeconds: v.durationSeconds
            })
          }
        }
      }
    }

    return validSongs.slice(0, limit)
  } catch (error) {
    console.error(`Error obteniendo canciones individuales de ${artistName}:`, error)
    return []
  }
}

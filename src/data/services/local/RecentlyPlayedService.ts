const STORAGE_KEY = 'recentlyPlayed'
const MAX_ITEMS = 30

export interface RecentlyPlayedTrack {
  video_id: string
  video_title: string
  video_thumbnail: string
  video_author?: string
  played_at: Date
}

// Obtener todas las reproducciones recientes
export const getRecentlyPlayed = (): RecentlyPlayedTrack[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const tracks = JSON.parse(stored)
    return tracks.map((track: any) => ({
      ...track,
      played_at: new Date(track.played_at),
    }))
  } catch (error) {
    console.error('Error obteniendo historial:', error)
    return []
  }
}

// Eliminar una canción específica del historial
export const removeFromRecentlyPlayed = (videoId: string): RecentlyPlayedTrack[] => {
  try {
    const current = getRecentlyPlayed()
    const filtered = current.filter((track) => track.video_id !== videoId)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))

    return filtered
  } catch (error) {
    console.error('Error eliminando del historial:', error)
    return []
  }
}

// Limpiar todo el historial
export const clearRecentlyPlayed = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error limpiando historial:', error)
  }
}

// Obtener las últimas N reproducciones
export const getLastNRecentlyPlayed = (n: number): RecentlyPlayedTrack[] => {
  const all = getRecentlyPlayed()
  return all.slice(0, n)
}

// Obtener artista más escuchado del historial
export const getMostPlayedArtist = (): { artist: string; count: number } | null => {
  const tracks = getRecentlyPlayed()

  if (tracks.length === 0) return null

  const artistCount: Record<string, number> = {}

  tracks.forEach((track) => {
    const artist = track.video_author || extractArtistFromTitle(track.video_title)
    artistCount[artist] = (artistCount[artist] || 0) + 1
  })

  const topArtist = Object.entries(artistCount).sort((a, b) => b[1] - a[1])[0]

  return topArtist ? { artist: topArtist[0], count: topArtist[1] } : null
}

// Función auxiliar para extraer artista del título
const extractArtistFromTitle = (title: string): string => {
  // Patrones comunes en títulos de YouTube
  const patterns = [
    /^(.+?)\s*[-–—]\s*.+$/, // "Artista - Canción"
    /^(.+?)\s*:\s*.+$/, // "Artista: Canción"
    /^(.+?)\s*【.+?】.+$/, // "Artista 【...】..."
    /^(.+?)\s*\(.+?\).+$/, // "Artista (remix)..."
  ]

  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match) return match[1].trim()
  }

  // Si no se detecta, tomar primeras palabras
  return title.split(' ').slice(0, 2).join(' ')
}

// Verificar si una canción está en el historial
export const isInRecentlyPlayed = (videoId: string): boolean => {
  const tracks = getRecentlyPlayed()
  return tracks.some((track) => track.video_id === videoId)
}

// Obtener estadísticas del historial
export const getRecentlyPlayedStats = () => {
  const tracks = getRecentlyPlayed()

  return {
    total: tracks.length,
    today: tracks.filter((t) => {
      const today = new Date()
      const playedDate = new Date(t.played_at)
      return playedDate.toDateString() === today.toDateString()
    }).length,
    thisWeek: tracks.filter((t) => {
      const now = new Date()
      const weekAgo = new Date(now.setDate(now.getDate() - 7))
      return new Date(t.played_at) > weekAgo
    }).length,
    topArtist: getMostPlayedArtist(),
  }
}

export const addToRecentlyPlayed = (
  track: Omit<RecentlyPlayedTrack, 'played_at'>,
): RecentlyPlayedTrack[] => {
  try {
    const current = getRecentlyPlayed()

    const newTrack: RecentlyPlayedTrack = {
      ...track,
      played_at: new Date(),
    }

    const filtered = current.filter((t) => t.video_id !== track.video_id)
    const updated = [newTrack, ...filtered].slice(0, MAX_ITEMS)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    console.log(`✅ Agregado al historial: ${track.video_title}, total: ${updated.length}`)

    return updated
  } catch (error) {
    console.error('Error agregando al historial:', error)
    return []
  }
}

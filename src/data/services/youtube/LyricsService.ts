interface LyricsLine {
  time: number
  text: string
}

export interface LyricsData {
  title: string
  artist: string
  syncedLyrics: LyricsLine[]
  plainLyrics: string
}

export class LyricsService {
  private static readonly API_BASE = 'https://lrclib.net/api'

  /**
   * Parsear formato LRC correctamente
   */
  private static parseLRC(lrcText: string): LyricsLine[] {
    const lines: LyricsLine[] = []
    const regex = /\[(\d{2}):(\d{2})\.(\d{2})\](.*)/g
    let match

    while ((match = regex.exec(lrcText)) !== null) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const milliseconds = parseInt(match[3])
      const time = minutes * 60 + seconds + milliseconds / 100
      const text = match[4].trim()
      if (text) {
        lines.push({ time, text })
      }
    }

    return lines.sort((a, b) => a.time - b.time)
  }

  /**
   * Buscar letras sincronizadas por título y artista
   */
  static async getSyncedLyrics(title: string, artist: string): Promise<LyricsData | null> {
    try {
      // Limpiar título
      const cleanTitle = title
        .replace(/\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/Official\s*(Audio|Video|Music\s*Video)/gi, '')
        .replace(/Lyrics/gi, '')
        .replace(/[^\w\s]/g, '')
        .trim()

      const cleanArtist = artist.replace(/[^\w\s]/g, '').trim()

      console.log(`🔍 Buscando letras para: ${cleanTitle} - ${cleanArtist}`)

      const url = `${this.API_BASE}/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`
      const response = await fetch(url)

      if (!response.ok) {
        console.log(`No se encontraron letras: ${response.status}`)
        return null
      }

      const data = await response.json()

      // Parsear letras sincronizadas
      let syncedLines: LyricsLine[] = []
      if (data.syncedLyrics) {
        syncedLines = this.parseLRC(data.syncedLyrics)
        console.log(`✅ Letras sincronizadas encontradas: ${syncedLines.length} líneas`)
      }

      // Parsear letras simples
      let plainLines = ''
      if (data.plainLyrics) {
        plainLines = data.plainLyrics
      }

      if (syncedLines.length === 0 && !plainLines) {
        console.log('No hay contenido de letras')
        return null
      }

      return {
        title: data.trackName || cleanTitle,
        artist: data.artistName || cleanArtist,
        syncedLyrics: syncedLines,
        plainLyrics: plainLines,
      }
    } catch (error) {
      console.error('Error obteniendo letras:', error)
      return null
    }
  }
}

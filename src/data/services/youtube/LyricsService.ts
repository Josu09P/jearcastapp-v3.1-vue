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

  private static parseLRC(lrcText: string): LyricsLine[] {
    const lines: LyricsLine[] = []
    const regex = /\[(\d{2}):(\d{2})\.(\d{2})\](.*)/g
    let match

    while ((match = regex.exec(lrcText)) !== null) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const centiseconds = parseInt(match[3], 10)
      const time = minutes * 60 + seconds + centiseconds / 100
      const text = match[4].trim()

      if (text) {
        lines.push({ time, text })
      }
    }

    return lines.sort((a, b) => a.time - b.time)
  }

  /**
   * Limpieza inteligente del título
   */
  private static cleanTitle(title: string): string {
    // Extraer el título principal (después del guión si existe)
    let mainTitle = title
    if (title.includes('-')) {
      const parts = title.split('-')
      mainTitle = parts.length > 1 ? parts[1].trim() : title
    }

    let cleaned = mainTitle
      // Eliminar paréntesis con información de video/lyric
      .replace(/\s*\([^)]*(?:Video|Lyric|Official|Audio|Video Lírico)[^)]*\)/gi, '')
      .replace(/\s*\[[^\]]*(?:Video|Lyric|Official|Audio)[^\]]*\]/gi, '')
      // Eliminar palabras genéricas
      .replace(/\b(Official|Video|Lyric|Audio|Music|Video Lírico)\b/gi, '')
      // Mantener "Remix" pero limpiar
      .replace(/\s*\(Remix\)/gi, ' Remix')
      // Mantener "ft." pero simplificar
      .replace(/\s*ft\.\s*/gi, ' ft ')
      .replace(/\s*feat\.\s*/gi, ' ft ')
      // Limpiar caracteres especiales excesivos
      .replace(/["""'']/g, '')
      // Normalizar espacios
      .replace(/\s+/g, ' ')
      .trim()

    // Si el título resultante es muy largo (>50 chars), tomar las primeras palabras clave
    if (cleaned.length > 50) {
      const words = cleaned.split(' ')
      // Mantener solo las primeras 5-6 palabras clave
      const keywords = []
      for (const word of words) {
        if (word.length > 2 && !['ft', 'feat', 'remix'].includes(word.toLowerCase())) {
          keywords.push(word)
        }
        if (keywords.length >= 5) break
      }
      // Si encontramos "Remix", lo añadimos al final
      if (cleaned.toLowerCase().includes('remix') && !keywords.includes('Remix')) {
        keywords.push('Remix')
      }
      cleaned = keywords.join(' ')
    }

    return cleaned
  }

  /**
   * Extraer artistas de manera inteligente
   */
  private static extractArtists(title: string, providedArtist: string): string[] {
    const artists: string[] = []

    // 1. Si hay artista proporcionado, usarlo como principal
    if (providedArtist && providedArtist.trim() !== '') {
      artists.push(providedArtist.trim())
    }

    // 2. Intentar extraer del título (formato "Artista - Canción")
    if (title.includes('-')) {
      const parts = title.split('-')
      const artistPart = parts[0].trim()
      if (artistPart && !artists.includes(artistPart)) {
        artists.push(artistPart)
      }
    }

    // 3. Buscar artistas en "ft." o "feat."
    const ftMatches = title.match(/(?:ft\.|feat\.)\s*([^,(]+)/gi)
    if (ftMatches) {
      for (const match of ftMatches) {
        const ftArtist = match.replace(/(?:ft\.|feat\.)/i, '').trim()
        if (ftArtist && !artists.includes(ftArtist)) {
          artists.push(ftArtist)
        }
      }
    }

    return artists
  }

  /**
   * Estrategia 1: Búsqueda exacta con artista principal
   */
  private static async searchExact(title: string, artist: string): Promise<LyricsData | null> {
    const cleanTitle = this.cleanTitle(title)
    const url = `${this.API_BASE}/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(artist)}`
    console.log(`[NETWORK] Estrategia 1 (exacta): ${url}`)

    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      if (data && (data.syncedLyrics || data.plainLyrics)) {
        return this.processLyricsData(data)
      }
    }
    return null
  }

  /**
   * Estrategia 2: Búsqueda general y mejor coincidencia
   */
  private static async searchGeneral(title: string): Promise<LyricsData | null> {
    const cleanTitle = this.cleanTitle(title)
    const searchUrl = `${this.API_BASE}/search?q=${encodeURIComponent(cleanTitle)}`
    console.log(`[NETWORK] Estrategia 2 (general): ${searchUrl}`)

    const response = await fetch(searchUrl)
    if (!response.ok) return null

    const results = await response.json()
    if (!results || results.length === 0) return null

    console.log(`[INFO] Encontrados ${results.length} resultados`)

    // Ordenar por similitud
    const scored = results.map((result: any) => ({
      result,
      score: this.calculateSimilarity(cleanTitle, result.trackName),
    }))

    scored.sort((a: any, b: any) => b.score - a.score)

    console.log(
      `[SUCCESS] Mejor coincidencia: "${scored[0].result.trackName}" - ${scored[0].result.artistName} (score: ${scored[0].score})`,
    )

    if (scored[0].score > 0.3) {
      const detailUrl = `${this.API_BASE}/get?track_name=${encodeURIComponent(scored[0].result.trackName)}&artist_name=${encodeURIComponent(scored[0].result.artistName)}`
      const detailResponse = await fetch(detailUrl)
      if (detailResponse.ok) {
        const data = await detailResponse.json()
        return this.processLyricsData(data)
      }
    }

    return null
  }

  /**
   * Estrategia 3: Búsqueda por palabras clave principales
   */
  private static async searchByKeywords(title: string): Promise<LyricsData | null> {
    const keywords = this.extractKeywords(title)
    if (keywords.length === 0) return null

    const query = keywords.join(' ')
    console.log(`[NETWORK] Estrategia 3 (keywords): "${query}"`)

    const url = `${this.API_BASE}/search?q=${encodeURIComponent(query)}`
    const response = await fetch(url)

    if (!response.ok) return null

    const results = await response.json()
    if (!results || results.length === 0) return null

    // Tomar el primer resultado
    const bestMatch = results[0]
    console.log(`[SUCCESS] Coincidencia por keywords: "${bestMatch.trackName}" - ${bestMatch.artistName}`)

    const detailUrl = `${this.API_BASE}/get?track_name=${encodeURIComponent(bestMatch.trackName)}&artist_name=${encodeURIComponent(bestMatch.artistName)}`
    const detailResponse = await fetch(detailUrl)

    if (detailResponse.ok) {
      const data = await detailResponse.json()
      return this.processLyricsData(data)
    }

    return null
  }

  /**
   * Calcular similitud entre dos títulos
   */
  private static calculateSimilarity(title1: string, title2: string): number {
    const t1 = title1.toLowerCase()
    const t2 = title2.toLowerCase()

    // Coincidencia exacta
    if (t1 === t2) return 1.0

    const words1 = t1.split(' ')
    const words2 = t2.split(' ')

    let matches = 0
    for (const word of words1) {
      if (word.length > 2 && words2.includes(word)) {
        matches++
      }
    }

    // Bonus para "remix"
    let bonus = 0
    if (t1.includes('remix') && t2.includes('remix')) bonus += 0.2
    if (t1.includes('ft') && t2.includes('ft')) bonus += 0.1

    return matches / Math.max(words1.length, words2.length) + bonus
  }

  /**
   * Extraer palabras clave importantes
   */
  private static extractKeywords(title: string): string[] {
    const cleanTitle = this.cleanTitle(title)
    const words = cleanTitle.split(' ')
    const importantWords: string[] = []

    for (const word of words) {
      if (word.length > 2) {
        importantWords.push(word)
      }
      if (importantWords.length >= 4) break
    }

    return importantWords
  }

  /**
   * Procesar datos de letras
   */
  private static processLyricsData(data: any): LyricsData {
    let syncedLines: LyricsLine[] = []
    if (data.syncedLyrics) {
      syncedLines = this.parseLRC(data.syncedLyrics)
      console.log(`✅ Letras sincronizadas: ${syncedLines.length} líneas`)
    }

    let plainLines = ''
    if (data.plainLyrics) {
      plainLines = data.plainLyrics
      console.log(`✅ Letras simples: ${plainLines.length} caracteres`)
    }

    return {
      title: data.trackName || 'Desconocido',
      artist: data.artistName || 'Desconocido',
      syncedLyrics: syncedLines,
      plainLyrics: plainLines,
    }
  }

  /**
   * Método principal: buscar letras con múltiples estrategias
   */
  static async getSyncedLyrics(title: string, artist: string): Promise<LyricsData | null> {
    try {
      console.log(`🎤 Buscando letras para: "${title}"`)

      const artists = this.extractArtists(title, artist)
      console.log(`👥 Artistas detectados: ${artists.join(', ')}`)

      // Estrategia 1: Buscar con cada artista
      for (const currentArtist of artists) {
        const result = await this.searchExact(title, currentArtist)
        if (result) return result
      }

      // Estrategia 2: Búsqueda general
      const generalResult = await this.searchGeneral(title)
      if (generalResult) return generalResult

      // Estrategia 3: Búsqueda por palabras clave
      const keywordResult = await this.searchByKeywords(title)
      if (keywordResult) return keywordResult

      console.log('❌ No se encontraron letras después de todas las estrategias')
      return null
    } catch (error) {
      console.error('Error obteniendo letras:', error)
      return null
    }
  }

  static async getLyricsByTitle(title: string): Promise<LyricsData | null> {
    return this.getSyncedLyrics(title, '')
  }
}

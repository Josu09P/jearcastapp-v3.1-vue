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

  private static isArtistMatch(artist1: string, artist2: string): boolean {
    const a1 = this.cleanArtist(artist1).toLowerCase()
    const a2 = this.cleanArtist(artist2).toLowerCase()
    return a1.includes(a2) || a2.includes(a1)
  }

  /**
   * Limpieza inteligente del título considerando el artista si está disponible
   */
  private static cleanTitle(title: string, artist?: string): string {
    let mainTitle = title
    if (title.includes('-')) {
      const parts = title.split('-')
      if (parts.length > 1) {
        const left = parts[0].trim()
        const right = parts.slice(1).join('-').trim()
        // Si el artista coincide con la parte derecha, el título está en la parte izquierda
        if (artist && this.isArtistMatch(artist, right)) {
          mainTitle = left
        } else {
          // Por convención estándar "Artista - Título", tomar derecha
          mainTitle = right
        }
      }
    }

    let cleaned = mainTitle
      // Eliminar paréntesis y corchetes con información de video/lyric/calidad
      .replace(/\s*[\(\[](?:Official\s*)?(?:Music\s*)?(?:Video|Lyric|Audio|Video Lírico|Visualizer|En Vivo|Live|Clip Oficial|Remastered|HD|4K)[^\)\]]*[\)\]]/gi, '')
      .replace(/\s*[\(\[](?:Letra|Lyrics)[^\)\]]*[\)\]]/gi, '')
      .replace(/\|.*$/g, '')
      // Eliminar palabras genéricas residuales
      .replace(/\b(Official Music Video|Official Video|Video Oficial|Video Lírico|Visualizer)\b/gi, '')
      // Mantener "Remix" pero simplificar
      .replace(/\s*\(Remix\)/gi, ' Remix')
      // Mantener "ft." pero simplificar
      .replace(/\s*(?:ft\.|feat\.)\s*/gi, ' ft ')
      .replace(/["""'']/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    // Si el título resultante es muy largo (>50 chars), tomar las primeras palabras clave
    if (cleaned.length > 50) {
      const words = cleaned.split(' ')
      const keywords = []
      for (const word of words) {
        if (word.length > 2 && !['ft', 'feat', 'remix'].includes(word.toLowerCase())) {
          keywords.push(word)
        }
        if (keywords.length >= 5) break
      }
      if (cleaned.toLowerCase().includes('remix') && !keywords.includes('Remix')) {
        keywords.push('Remix')
      }
      cleaned = keywords.join(' ')
    }

    return cleaned
  }

  private static cleanArtist(artist: string): string {
    return artist
      .replace(/\s*-\s*Topic$/i, '')
      .replace(/VEVO$/i, '')
      .replace(/\s*Official\s*$/i, '')
      .replace(/\s*Channel\s*$/i, '')
      .trim()
  }

  /**
   * Extraer artistas de manera inteligente
   */
  private static extractArtists(title: string, providedArtist: string): string[] {
    const artists: string[] = []

    // 1. Si hay artista proporcionado, usarlo como principal
    if (providedArtist && providedArtist.trim() !== '') {
      const cleaned = this.cleanArtist(providedArtist)
      if (cleaned) artists.push(cleaned)
    }

    // 2. Intentar extraer del título (formato "Artista - Canción")
    if (title.includes('-')) {
      const parts = title.split('-')
      const artistPart = this.cleanArtist(parts[0].trim())
      if (artistPart && !artists.includes(artistPart)) {
        artists.push(artistPart)
      }
    }

    // 3. Buscar artistas en "ft." o "feat."
    const ftMatches = title.match(/(?:ft\.|feat\.)\s*([^,(]+)/gi)
    if (ftMatches) {
      for (const match of ftMatches) {
        const ftArtist = this.cleanArtist(match.replace(/(?:ft\.|feat\.)/i, '').trim())
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
    const cleanTitle = this.cleanTitle(title, artist)
    const url = `${this.API_BASE}/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(artist)}`
    console.log(`[NETWORK] Estrategia 1 (exacta): ${url}`)

    try {
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        if (data && (data.syncedLyrics || data.plainLyrics)) {
          return this.processLyricsData(data)
        }
      }
    } catch (_) {}
    return null
  }

  /**
   * Estrategia 2: Búsqueda general y mejor coincidencia (artista + título combinado)
   */
  private static async searchGeneral(title: string, artist?: string): Promise<LyricsData | null> {
    const cleanTitle = this.cleanTitle(title, artist)
    const cleanArt = artist ? this.cleanArtist(artist) : ''

    const queries: string[] = []
    if (cleanArt && cleanTitle) {
      queries.push(`${cleanArt} ${cleanTitle}`)
    }
    queries.push(cleanTitle)

    for (const query of queries) {
      const searchUrl = `${this.API_BASE}/search?q=${encodeURIComponent(query)}`
      console.log(`[NETWORK] Estrategia 2 (general): ${searchUrl}`)

      try {
        const response = await fetch(searchUrl)
        if (!response.ok) continue

        const results = await response.json()
        if (!results || results.length === 0) continue

        console.log(`[INFO] Encontrados ${results.length} resultados para "${query}"`)

        // Preferir resultados con letras
        const withLyrics = results.filter((r: any) => r.syncedLyrics || r.plainLyrics)
        const list = withLyrics.length > 0 ? withLyrics : results

        const scored = list.map((result: any) => {
          let score = this.calculateSimilarity(cleanTitle, result.trackName)
          if (cleanArt && result.artistName && this.isArtistMatch(cleanArt, result.artistName)) {
            score += 0.4
          }
          if (result.syncedLyrics) score += 0.3
          return { result, score }
        })

        scored.sort((a: any, b: any) => b.score - a.score)

        if (scored.length > 0 && scored[0].score > 0.25) {
          const best = scored[0].result
          if (best.syncedLyrics || best.plainLyrics) {
            return this.processLyricsData(best)
          }

          const detailUrl = `${this.API_BASE}/get?track_name=${encodeURIComponent(best.trackName)}&artist_name=${encodeURIComponent(best.artistName)}`
          const detailResponse = await fetch(detailUrl)
          if (detailResponse.ok) {
            const data = await detailResponse.json()
            return this.processLyricsData(data)
          }
        }
      } catch (_) {}
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
    try {
      const response = await fetch(url)
      if (!response.ok) return null

      const results = await response.json()
      if (!results || results.length === 0) return null

      const withLyrics = results.find((r: any) => r.syncedLyrics || r.plainLyrics) || results[0]
      if (withLyrics.syncedLyrics || withLyrics.plainLyrics) {
        return this.processLyricsData(withLyrics)
      }
    } catch (_) {}

    return null
  }

  /**
   * Calcular similitud entre dos títulos
   */
  private static calculateSimilarity(title1: string, title2: string): number {
    const t1 = title1.toLowerCase()
    const t2 = title2.toLowerCase()

    if (t1 === t2) return 1.0

    const words1 = t1.split(' ')
    const words2 = t2.split(' ')

    let matches = 0
    for (const word of words1) {
      if (word.length > 2 && words2.includes(word)) {
        matches++
      }
    }

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
  static async getSyncedLyrics(title: string, artist: string, videoId?: string): Promise<LyricsData | null> {
    try {
      console.log(`🎤 Buscando letras para: "${title}" (videoId: ${videoId})`)

      const artists = this.extractArtists(title, artist)
      console.log(`👥 Artistas detectados: ${artists.join(', ')}`)

      // Estrategia 1: Buscar con cada artista en LRCLIB
      for (const currentArtist of artists) {
        const result = await this.searchExact(title, currentArtist)
        if (result && (result.syncedLyrics.length > 0 || result.plainLyrics)) return result
      }

      // Estrategia 2: Búsqueda general en LRCLIB (artista + canción)
      const generalResult = await this.searchGeneral(title, artist)
      if (generalResult && (generalResult.syncedLyrics.length > 0 || generalResult.plainLyrics)) return generalResult

      // Estrategia 3: Búsqueda por palabras clave en LRCLIB
      const keywordResult = await this.searchByKeywords(title)
      if (keywordResult && (keywordResult.syncedLyrics.length > 0 || keywordResult.plainLyrics)) return keywordResult

      // Estrategia 4 (Respaldo Sincronizado): Subtítulos de YouTube vía Electron IPC
      if (videoId && window.electron?.getVideoSubtitles) {
        console.log(`📺 Intentando obtener letras/subtítulos de YouTube para ${videoId}...`)
        const ytSubs = await window.electron.getVideoSubtitles(videoId)
        if (ytSubs && ytSubs.syncedLyrics?.length > 0) {
          console.log(`✅ Letras sincronizadas obtenidas de YouTube: ${ytSubs.syncedLyrics.length} líneas`)
          return {
            title,
            artist: artist || 'YouTube',
            syncedLyrics: ytSubs.syncedLyrics,
            plainLyrics: ytSubs.plainLyrics || ''
          }
        }
      }

      console.log('❌ No se encontraron letras después de todas las estrategias')
      return null
    } catch (error) {
      console.error('Error obteniendo letras:', error)
      return null
    }
  }

  static async getLyricsByTitle(title: string, videoId?: string): Promise<LyricsData | null> {
    return this.getSyncedLyrics(title, '', videoId)
  }
}

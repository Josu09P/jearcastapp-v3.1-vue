/**
 * YouTubeScraperService
 * 
 * Este servicio extrae información directamente del sitio web de YouTube
 * sin utilizar la API oficial (ahorrando cuota de tokens).
 * Utiliza el objeto ytInitialData presente en el HTML de las páginas de YouTube.
 */

export interface ScrapedVideo {
  videoId: string
  title: string
  thumbnail: string
  author: string
  duration?: string
  views?: string
}

class YouTubeScraperService {
  /**
   * Obtiene videos relacionados (sugerencias) de una canción base.
   * Esto es lo que permite crear mixes con la misma "vibra".
   */
  async getRelatedVideos(videoId: string): Promise<ScrapedVideo[]> {
    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`
      console.log(`[Scraper] Obteniendo recomendaciones para: ${videoId}`)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'es-ES,es;q=0.9'
        }
      })
      
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)
      
      const html = await response.text()
      
      // Regex mejorada para capturar ytInitialData en diferentes formatos
      const regex = /(?:var|window\[['"]|window\.)ytInitialData\s*=\s*({.+?});/s
      const match = html.match(regex)
      
      if (!match || !match[1]) {
        console.warn('[Scraper] No se encontró ytInitialData en el HTML')
        return []
      }
      
      const data = JSON.parse(match[1])
      
      // YouTube cambia la ruta a veces, probamos las más comunes
      const results = 
        data.contents?.twoColumnWatchNextResults?.secondaryResults?.secondaryResults?.results ||
        data.contents?.twoColumnWatchNextResults?.secondaryResults?.results
      
      if (!results) {
        console.warn('[Scraper] No se encontraron resultados secundarios en el JSON')
        return []
      }
      
      const relatedVideos: ScrapedVideo[] = []
      
      results.forEach((item: any) => {
        const video = item.compactVideoRenderer || item.videoRenderer
        if (video && video.videoId) {
          relatedVideos.push({
            videoId: video.videoId,
            title: video.title?.simpleText || video.title?.runs?.[0]?.text || 'Sin título',
            thumbnail: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
            author: video.longBylineText?.runs?.[0]?.text || video.shortBylineText?.runs?.[0]?.text || 'Artista desconocido',
            duration: video.lengthText?.simpleText,
            views: video.viewCountText?.simpleText
          })
        }
      })
      
      console.log(`[Scraper] Se encontraron ${relatedVideos.length} recomendaciones`)
      
      // ✅ Fallback para Desarrollo en Navegador (CORS Bypass)
      if (relatedVideos.length === 0) {
        return this.getMockResults('Recomendaciones', videoId)
      }

      return relatedVideos
    } catch (error) {
      console.error('[Scraper] Error en getRelatedVideos:', error)
      return this.getMockResults('Relacionados (Fallback)', videoId)
    }
  }

  /**
   * Genera resultados de prueba cuando hay errores de CORS (Navegador)
   * En Electron esto no será necesario.
   */
  private getMockResults(type: string, seed: string): ScrapedVideo[] {
    console.warn(`[Scraper] Petición bloqueada o fallida para: ${seed}. No se devolverán mocks hardcodeados.`);
    return [];
  }

  async searchWithoutToken(query: string): Promise<ScrapedVideo[]> {
    try {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
      console.log(`[Scraper] Buscando (sin token): ${query}`)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })
      
      const html = await response.text()
      const regex = /(?:var|window\[['"]|window\.)ytInitialData\s*=\s*({.+?});/s
      const match = html.match(regex)
      
      if (!match) return this.getMockResults('Búsqueda', query)
      
      const data = JSON.parse(match[1])
      
      const contents = 
        data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents ||
        data.contents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents
      
      if (!contents) return this.getMockResults('Búsqueda', query)
      
      const results = contents
        .filter((item: any) => item.videoRenderer)
        .map((item: any) => {
          const v = item.videoRenderer
          return {
            videoId: v.videoId,
            title: v.title?.runs?.[0]?.text || 'Sin título',
            thumbnail: v.thumbnail?.thumbnails?.[0]?.url || '',
            author: v.ownerText?.runs?.[0]?.text || 'Artista desconocido'
          }
        })
        
      if (results.length === 0) return this.getMockResults('Búsqueda', query)

      console.log(`[Scraper] Búsqueda finalizada: ${results.length} resultados`)
      return results
    } catch (error) {
      console.error('[Scraper] Error en searchWithoutToken:', error)
      return this.getMockResults('Búsqueda (Fallback)', query)
    }
  }
}

export const youtubeScraperService = new YouTubeScraperService()

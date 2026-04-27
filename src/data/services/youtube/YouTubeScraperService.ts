/**
 * YouTubeScraperService - Ultra simplificado
 * Solo llama al backend de Electron (yt-dlp)
 */

export interface ScrapedVideo {
  videoId: string
  title: string
  thumbnail: string
  author: string
  duration?: string
  views?: string
  url?: string
}

import { contentFilterService } from '../audio/ContentFilterService'

class YouTubeScraperService {
  async searchWithoutToken(query: string): Promise<ScrapedVideo[]> {
    // Añadir términos negativos para que YouTube no los incluya
    const safeQuery = `${query}${contentFilterService.getExclusionQuery()}`
    console.log(`🔍 [Frontend] Solicitando búsqueda segura: "${safeQuery}"`)

    try {
      if ((window as any).electron?.youtubeSearch) {
        const startTime = performance.now()
        const results = await (window as any).electron.youtubeSearch(safeQuery)
        const elapsed = (performance.now() - startTime).toFixed(0)

        // Filtro adicional en el frontend por seguridad
        const filteredResults = contentFilterService.filterVideos<ScrapedVideo>(results)
        
        console.log(`✅ [Frontend] ${filteredResults.length} resultados seguros (de ${results.length}) en ${elapsed}ms`)
        return filteredResults as ScrapedVideo[]
      }

      console.warn('⚠️ [Frontend] Backend no disponible')
      return []
    } catch (error) {
      console.error('❌ [Frontend] Error:', error)
      return []
    }
  }

  async getRelatedVideos(videoId: string): Promise<ScrapedVideo[]> {
    try {
      if ((window as any).electron?.youtubeRelated) {
        return await (window as any).electron.youtubeRelated(videoId)
      }
      return []
    } catch {
      return []
    }
  }

  // AGREGAR ESTE MÉTODO QUE FALTABA
  async getDirectStreamUrl(videoId: string): Promise<string | null> {
    console.log(`🔗 [Frontend] Solicitando stream directo para: ${videoId}`)

    try {
      if ((window as any).electron?.ipcRenderer?.invoke) {
        const streamUrl = await (window as any).electron.ipcRenderer.invoke(
          'get-stream-url',
          videoId,
        )
        return streamUrl || null
      }
      return null
    } catch (error) {
      console.error('❌ [Frontend] Error obteniendo stream:', error)
      return null
    }
  }
}

export const youtubeScraperService = new YouTubeScraperService()

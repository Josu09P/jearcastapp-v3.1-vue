import { youtubeScraperService } from '@/data/services/youtube/YouTubeScraperService'
import { getRecentlyPlayed } from '@/data/services/local/RecentlyPlayedService'
import type { MixModel } from '@/domain/models/MixModel'

/**
 * Genera un Mix de Descubrimiento basado en las canciones más recientes.
 * Utiliza scraping para obtener recomendaciones sin gastar tokens de API.
 */
export const generateDiscoveryMix = async (): Promise<MixModel | null> => {
  try {
    const recentTracks = getRecentlyPlayed()
    console.log('[MixDiscovery] Canciones recientes encontradas:', recentTracks.length)
    
    if (recentTracks.length === 0) {
      console.log('[MixDiscovery] No hay historial suficiente para generar un mix de descubrimiento')
      return null
    }

    // Tomar las 3 canciones más recientes como "semillas"
    const seeds = recentTracks.slice(0, 3)
    console.log('[MixDiscovery] Usando semillas:', seeds.map(s => s.video_title))
    
    let allRecommendations: any[] = []

    // Obtener recomendaciones para cada semilla (en paralelo)
    const recommendationPromises = seeds.map(seed => 
      youtubeScraperService.getRelatedVideos(seed.video_id)
    )

    const results = await Promise.all(recommendationPromises)
    console.log('[MixDiscovery] Resultados de scraping obtenidos:', results.map(r => r.length))
    
    // Aplanar y filtrar duplicados
    const seenIds = new Set(recentTracks.map(t => t.video_id))
    
    results.forEach(group => {
      group.forEach(video => {
        if (!seenIds.has(video.videoId)) {
          allRecommendations.push(video)
          seenIds.add(video.videoId)
        }
      })
    })

    if (allRecommendations.length === 0) return null

    // Mezclar aleatoriamente y tomar 20 canciones
    const shuffled = allRecommendations.sort(() => Math.random() - 0.5).slice(0, 20)

    // Crear el modelo de Mix
    return {
      id: `discovery-${Date.now()}`,
      name: 'Descubrimiento Semanal',
      description: `Basado en ${seeds[0].video_title} y más canciones que te gustan.`,
      cover: seeds[0].video_thumbnail,
      artist: 'Jearcast AI',
      songs: shuffled.map(v => ({
        videoId: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail,
        artist: v.author
      })),
      createdAt: new Date()
    }
  } catch (error) {
    console.error('Error generando Mix de Descubrimiento:', error)
    return null
  }
}

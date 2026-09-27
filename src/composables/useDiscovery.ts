import { ref } from 'vue'
import { usePlayerStore, type Track } from '@/stores/player-store'
import { useUserStore } from '@/stores/user'
import { useUserDataStore } from '@/stores/userDataStore'
import { youtubeScraperService } from '@/data/services/youtube/YouTubeScraperService'
import { detectMainArtist, calculateSimilarity } from '@/domain/usecases/mix/GetVibeFromTitle'
import { getRecentlyPlayed } from '@/data/services/local/RecentlyPlayedService'
import { getFavoritesByUser } from '@/domain/usecases/favorites/GetFavoritesByUser'

export const useDiscovery = () => {
    const playerStore = usePlayerStore()
    const userStore = useUserStore()
    const userDataStore = useUserDataStore()
    const isExpanding = ref(false)

    /**
     * Intenta cargar más canciones de la fuente original (Context Pagination)
     */
    const expandFromContext = async (): Promise<Track[]> => {
        const context = playerStore.playbackContext
        if (!context) return []

        console.log(`[PAGINATION] Intentando cargar más canciones para contexto: ${context.type}`)
        let newSongs: any[] = []

        try {
            if (context.type === 'artist') {
                const targetArtist = context.name || (playerStore.currentTrack ? detectMainArtist(playerStore.currentTrack.video_author || '', playerStore.currentTrack.video_title) : '')
                if (targetArtist) {
                    console.log(`[PAGINATION] Buscando más canciones del artista: ${targetArtist}`)
                    const scraperResults = await youtubeScraperService.searchWithoutToken(`${targetArtist} canciones mejores exitos`)
                    if (scraperResults && Array.isArray(scraperResults)) {
                        newSongs = scraperResults.map((s: any) => ({
                            video_id: s.videoId,
                            video_title: s.title,
                            video_thumbnail: s.thumbnail,
                            video_author: targetArtist
                        }))
                    }
                }
            } else if (context.type === 'recommended') {
                const topicQuery = context.name ? `${context.name} music canciones mix` : 'musica recomendada exitos'
                console.log(`[PAGINATION] Buscando más canciones del tema recomendado: ${topicQuery}`)
                const scraperResults = await youtubeScraperService.searchWithoutToken(topicQuery)
                if (scraperResults && Array.isArray(scraperResults)) {
                    newSongs = scraperResults.map((s: any) => ({
                        video_id: s.videoId,
                        video_title: s.title,
                        video_thumbnail: s.thumbnail,
                        video_author: 'JearCast Music'
                    }))
                }
            } else if (context.type === 'favorites' && userDataStore.hasMoreFavorites) {
                newSongs = await userDataStore.loadMoreFavorites()
            } else if (context.type === 'playlist' && context.id && userDataStore.hasMorePlaylistSongs) {
                newSongs = await userDataStore.loadMoreSongsFromPlaylist(context.id)
            }

            const existingIds = new Set(playerStore.playlist.map(s => s.video_id))
            const uniqueSongs = newSongs
                .filter((s: any) => !existingIds.has(s.video_id))
                .slice(0, 10)
                .map((s: any) => ({
                    video_id: s.video_id,
                    video_title: s.video_title,
                    video_thumbnail: s.video_thumbnail,
                    video_author: s.video_author || (context.type === 'artist' ? context.name : 'JearCast Music')
                }))

            return uniqueSongs
        } catch (e) {
            console.error('[PAGINATION] Error cargando más canciones de la fuente:', e)
            return []
        }
    }

    const expandPlaylistWithMoreSongs = async () => {
        if (isExpanding.value) return
        isExpanding.value = true

        try {
            const context = playerStore.playbackContext

            // 1. PRIORIDAD: Cargar de la fuente original (Artista, Tema, Playlist, Favoritos)
            const contextSongs = await expandFromContext()
            if (contextSongs.length > 0) {
                console.log(`[PAGINATION] Añadidas ${contextSongs.length} canciones de la fuente original`)
                playerStore.addToPlaylist(contextSongs)
                
                // Actualizar el estado 'hasMore' en el player store
                if (context?.type === 'favorites') playerStore.setHasMore(userDataStore.hasMoreFavorites)
                else if (context?.type === 'playlist') playerStore.setHasMore(userDataStore.hasMorePlaylistSongs)
                else if (context?.type === 'artist' || context?.type === 'recommended') playerStore.setHasMore(true)
                
                return // Éxito con la fuente original
            }

            // Si es contexto de Artista y se acabaron las canciones inmediatas, buscar variaciones del artista
            if (context?.type === 'artist') {
                const targetArtist = context.name || (playerStore.currentTrack ? detectMainArtist(playerStore.currentTrack.video_author || '', playerStore.currentTrack.video_title) : '')
                if (targetArtist) {
                    console.log(`[PAGINATION] Buscando catálogo adicional para artista: ${targetArtist}`)
                    const scraperResults = await youtubeScraperService.searchWithoutToken(`${targetArtist} top tracks official audio`)
                    const existingIds = new Set(playerStore.playlist.map(song => song.video_id))
                    const extraTracks = scraperResults
                        .filter((v: any) => !existingIds.has(v.videoId))
                        .slice(0, 8)
                        .map((v: any) => ({
                            video_id: v.videoId,
                            video_title: v.title,
                            video_thumbnail: v.thumbnail,
                            video_author: targetArtist
                        }))
                    if (extraTracks.length > 0) {
                        playerStore.addToPlaylist(extraTracks)
                        return
                    }
                }
                // Si es artista, NO caer en favoritos
                return
            }

            // Si es contexto de Tema Recomendado, buscar variaciones del tema
            if (context?.type === 'recommended') {
                const topicQuery = context.name ? `${context.name} playlist tracks` : 'temas recomendados musica'
                console.log(`[PAGINATION] Buscando catálogo adicional para tema: ${topicQuery}`)
                const scraperResults = await youtubeScraperService.searchWithoutToken(topicQuery)
                const existingIds = new Set(playerStore.playlist.map(song => song.video_id))
                const extraTracks = scraperResults
                    .filter((v: any) => !existingIds.has(v.videoId))
                    .slice(0, 8)
                    .map((v: any) => ({
                        video_id: v.videoId,
                        video_title: v.title,
                        video_thumbnail: v.thumbnail,
                        video_author: 'JearCast Music'
                    }))
                if (extraTracks.length > 0) {
                    playerStore.addToPlaylist(extraTracks)
                    return
                }
                // Si es topic, NO caer en favoritos
                return
            }

            // 2. FALLBACK GENÉRICO: Descubrimiento de YouTube (Radio Mode)
            const currentTrack = playerStore.currentTrack
            if (!currentTrack?.video_id) return

            const currentVideoId = currentTrack.video_id
            const currentTitle = currentTrack.video_title
            const currentArtist = detectMainArtist(currentTrack.video_author || '', currentTitle)
            const currentPlaylist = playerStore.playlist

            console.log(`[SEARCH] [Discovery] Analizando vibra para: "${currentTitle}"`)
            let rawResults = await youtubeScraperService.getRelatedVideos(currentVideoId)
            
            const existingIds = new Set(currentPlaylist.map(song => song.video_id))
            let candidates: any[] = []

            if (rawResults.length > 0) {
                candidates = rawResults
                    .filter((v: any) => !existingIds.has(v.videoId))
                    .map((v: any) => ({
                        video_id: v.videoId,
                        video_title: v.title,
                        video_thumbnail: v.thumbnail,
                        video_author: v.author,
                        score: (currentArtist && v.author.toLowerCase().includes(currentArtist.toLowerCase()) ? 100 : 0) +
                            calculateSimilarity(currentTitle, v.title) * 10
                    }))
                    .sort((a, b) => b.score - a.score)
            }

            if (candidates.length < 2 && currentArtist) {
                try {
                    const scraperResults = await youtubeScraperService.searchWithoutToken(`${currentArtist} canciones`)
                    if (scraperResults && Array.isArray(scraperResults)) {
                        const scraperTracks = scraperResults
                            .filter((v: any) => !existingIds.has(v.videoId))
                            .slice(0, 10)
                            .map((v: any) => ({
                                video_id: v.videoId,
                                video_title: v.title,
                                video_thumbnail: v.thumbnail,
                                video_author: v.author || currentArtist,
                                score: 100
                            }))
                        candidates = [...candidates, ...scraperTracks]
                    }
                } catch (e) {
                    console.warn('[Discovery] Error obteniendo canciones vía scraper:', e)
                }
            }

            // Solo usar favoritos si el contexto era explícitamente 'favorites'
            if (candidates.length === 0 && context?.type === 'favorites') {
                const history = getRecentlyPlayed()
                const favsResponse = await getFavoritesByUser(userStore.id || '')
                const favorites = Array.isArray(favsResponse) ? favsResponse : (favsResponse as any).favorites || []
                const pool = [...history, ...favorites]

                candidates = pool
                    .filter((item: any) => !existingIds.has(item.video_id))
                    .map((item: any) => ({
                        video_id: item.video_id,
                        video_title: item.video_title,
                        video_thumbnail: item.video_thumbnail,
                        video_author: item.video_author,
                        score: (currentArtist && item.video_author?.toLowerCase().includes(currentArtist.toLowerCase()) ? 50 : 0) +
                            calculateSimilarity(currentTitle, item.video_title) * 10
                    }))
                    .filter((item: any) => item.score > 10)
                    .sort((a, b) => b.score - a.score)
            }

            let toAdd = candidates.slice(0, 5)

            if (toAdd.length > 0) {
                playerStore.addToPlaylist(toAdd)
            }
        } catch (error) {
            console.error('Error crítico en el motor de descubrimiento:', error)
        } finally {
            isExpanding.value = false
        }
    }

    return {
        isExpanding,
        expandPlaylistWithMoreSongs
    }
}

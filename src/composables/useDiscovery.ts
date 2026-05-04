import { ref } from 'vue'
import { usePlayerStore, type Track } from '@/stores/player-store'
import { useUserStore } from '@/stores/user'
import { useUserDataStore } from '@/stores/userDataStore'
import { youtubeScraperService } from '@/data/services/youtube/YouTubeScraperService'
import { detectMainArtist, calculateSimilarity } from '@/domain/usecases/mix/GetVibeFromTitle'
import { getRecentlyPlayed } from '@/data/services/local/RecentlyPlayedService'
import { getFavoritesByUser } from '@/domain/usecases/favorites/GetFavoritesByUser'
import { searchSongsByArtist } from '@/data/services/youtube/SearchByArtistService'

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
            if (context.type === 'favorites' && userDataStore.hasMoreFavorites) {
                newSongs = await userDataStore.loadMoreFavorites()
            } else if (context.type === 'playlist' && context.id && userDataStore.hasMorePlaylistSongs) {
                newSongs = await userDataStore.loadMoreSongsFromPlaylist(context.id)
            } else if (context.type === 'recommended' && context.id && userDataStore.hasMoreRecommendedSongs) {
                newSongs = await userDataStore.loadMoreSongsFromRecommended(context.id)
            }

            // Mapear al formato Track si es necesario
            return newSongs.map(s => ({
                video_id: s.video_id,
                video_title: s.video_title,
                video_thumbnail: s.video_thumbnail,
                video_author: s.video_author || 'JearCast Music'
            }))
        } catch (e) {
            console.error('[PAGINATION] Error cargando más canciones de la fuente:', e)
            return []
        }
    }

    const expandPlaylistWithMoreSongs = async () => {
        if (isExpanding.value) return
        isExpanding.value = true

        try {
            // 1. PRIORIDAD: Cargar de la fuente original (Favoritos, Playlist, etc.)
            const contextSongs = await expandFromContext()
            if (contextSongs.length > 0) {
                console.log(`[PAGINATION] Añadidas ${contextSongs.length} canciones de la fuente original`)
                playerStore.addToPlaylist(contextSongs)
                
                // Actualizar el estado 'hasMore' en el player store
                const context = playerStore.playbackContext
                if (context?.type === 'favorites') playerStore.setHasMore(userDataStore.hasMoreFavorites)
                else if (context?.type === 'playlist') playerStore.setHasMore(userDataStore.hasMorePlaylistSongs)
                else if (context?.type === 'recommended') playerStore.setHasMore(userDataStore.hasMoreRecommendedSongs)
                
                return // Éxito con la fuente original
            }

            // 2. FALLBACK: Descubrimiento de YouTube (Radio Mode)
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

            if (candidates.length === 0) {
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

            if (candidates.length < 2 && userStore.apikeyYoutube && currentArtist) {
                const apiResults = await searchSongsByArtist(currentArtist, userStore.apikeyYoutube, 10)
                const apiTracks = apiResults
                    .filter((v: any) => !existingIds.has(v.videoId))
                    .map((v: any) => ({
                        video_id: v.videoId,
                        video_title: v.title,
                        video_thumbnail: v.thumbnail,
                        video_author: v.video_author || currentArtist,
                        score: 100
                    }))
                candidates = [...candidates, ...apiTracks]
            }

            let toAdd = candidates.slice(0, 5)

            if (toAdd.length === 0) {
                const favsResponse = await getFavoritesByUser(userStore.id || '')
                const favorites = Array.isArray(favsResponse) ? favsResponse : (favsResponse as any).favorites || []
                if (favorites.length > 0) {
                    toAdd = favorites
                        .filter((f: any) => !existingIds.has(f.video_id))
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 3)
                        .map((f: any) => ({
                            video_id: f.video_id,
                            video_title: f.video_title,
                            video_thumbnail: f.video_thumbnail,
                            video_author: f.video_author
                        }))
                }
            }

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

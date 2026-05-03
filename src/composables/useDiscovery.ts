import { ref } from 'vue'
import { usePlayerStore, type Track } from '@/stores/player-store'
import { useUserStore } from '@/stores/user'
import { youtubeScraperService } from '@/data/services/youtube/YouTubeScraperService'
import { detectMainArtist, calculateSimilarity } from '@/domain/usecases/mix/GetVibeFromTitle'
import { getRecentlyPlayed } from '@/data/services/local/RecentlyPlayedService'
import { getFavoritesByUser } from '@/domain/usecases/favorites/GetFavoritesByUser'
import { searchSongsByArtist } from '@/data/services/youtube/SearchByArtistService'

export const useDiscovery = () => {
    const playerStore = usePlayerStore()
    const userStore = useUserStore()
    const isExpanding = ref(false)

    const expandPlaylistWithMoreSongs = async () => {
        if (isExpanding.value) return
        const currentTrack = playerStore.currentTrack
        if (!currentTrack?.video_id) return

        isExpanding.value = true
        const currentVideoId = currentTrack.video_id
        const currentTitle = currentTrack.video_title
        const currentArtist = detectMainArtist(currentTrack.video_author || '', currentTitle)
        const currentPlaylist = playerStore.playlist

        try {
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

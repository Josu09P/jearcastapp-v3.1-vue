import { ref } from 'vue'
import { usePlayerStore, type Track } from '@/stores/player-store'
import { useUserDataStore } from '@/stores/userDataStore'

export const usePagination = () => {
    const playerStore = usePlayerStore()
    const userDataStore = useUserDataStore()
    const isPaginating = ref(false)

    const expandPlaylistFromSource = async () => {
        if (isPaginating.value) return
        
        const context = playerStore.playbackContext
        if (!context) return

        let newTracks: any[] = []
        isPaginating.value = true

        try {
            switch (context.type) {
                case 'favorites':
                    if (userDataStore.hasMoreFavorites) {
                        console.log('🔄 [Pagination] Cargando más favoritos automáticamente...')
                        newTracks = await userDataStore.loadMoreFavorites()
                    }
                    break

                case 'playlist':
                    if (context.id && userDataStore.hasMorePlaylistSongs) {
                        console.log(`🔄 [Pagination] Cargando más de playlist ${context.id}...`)
                        newTracks = await userDataStore.loadMoreSongsFromPlaylist(context.id)
                    }
                    break

                case 'recommended':
                    if (context.id && userDataStore.hasMoreRecommendedSongs) {
                        console.log(`🔄 [Pagination] Cargando más recomendados de ${context.id}...`)
                        newTracks = await userDataStore.loadMoreSongsFromRecommended(context.id)
                    }
                    break
            }

            if (newTracks.length > 0) {
                const tracksToAdd: Track[] = newTracks.map(t => ({
                    video_id: t.video_id,
                    video_title: t.video_title,
                    video_thumbnail: t.video_thumbnail,
                    video_author: t.video_author || 'Desconocido'
                }))

                playerStore.addToPlaylist(tracksToAdd)
                
                // Actualizar el estado de "hasMore" en el player store
                updateHasMoreInPlayer()
                
                return true
            }
        } catch (error) {
            console.error('Error en paginación automática:', error)
        } finally {
            isPaginating.value = false
        }
        
        return false
    }

    const updateHasMoreInPlayer = () => {
        const context = playerStore.playbackContext
        if (!context) return

        let hasMore = false
        if (context.type === 'favorites') hasMore = userDataStore.hasMoreFavorites
        else if (context.type === 'playlist') hasMore = userDataStore.hasMorePlaylistSongs
        else if (context.type === 'recommended') hasMore = userDataStore.hasMoreRecommendedSongs

        playerStore.setHasMore(hasMore)
    }

    return {
        isPaginating,
        expandPlaylistFromSource,
        updateHasMoreInPlayer
    }
}

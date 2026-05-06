import { ref } from 'vue'
import { usePlayerStore } from '@/stores/player-store'
import { LyricsService, type LyricsData } from '@/data/services/youtube/LyricsService'

export const usePlayerUI = () => {
    const playerStore = usePlayerStore()
    
    // UI State
    const isExpanded = ref(true)
    const MINI_PLAYER_OFFSET = 20
    const PLAYER_HEIGHT = 170
    const position = ref({
        x: MINI_PLAYER_OFFSET,
        y: window.innerHeight - PLAYER_HEIGHT - MINI_PLAYER_OFFSET
    })
    const isDragging = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })
    
    // Lyrics State
    const showLyrics = ref(false)
    const currentLyrics = ref<LyricsData | null>(null)
    const loadingLyrics = ref(false)

    const toggleExpand = () => {
        isExpanded.value = !isExpanded.value
    }

    const startDrag = (e: MouseEvent) => {
        if (playerStore.isFullScreen) return
        isDragging.value = true
        dragOffset.value = { x: e.clientX - position.value.x, y: e.clientY - position.value.y }
        window.addEventListener('mousemove', onDrag)
        window.addEventListener('mouseup', stopDrag)
    }

    const onDrag = (e: MouseEvent) => {
        if (!isDragging.value || playerStore.isFullScreen) return
        position.value = { x: e.clientX - dragOffset.value.x, y: e.clientY - dragOffset.value.y }
    }

    const stopDrag = () => {
        isDragging.value = false
        window.removeEventListener('mousemove', onDrag)
        window.removeEventListener('mouseup', stopDrag)
    }

    const toggleLyrics = async (currentTrack: any) => {
        showLyrics.value = !showLyrics.value
        if (showLyrics.value && !currentLyrics.value && currentTrack) {
            await loadLyrics(currentTrack)
        }
    }

    const loadLyrics = async (currentTrack: any) => {
        if (!currentTrack) return
        currentLyrics.value = null
        loadingLyrics.value = true
        try {
            let lyrics = await LyricsService.getSyncedLyrics(
                currentTrack.video_title,
                currentTrack.video_author || ''
            )
            if (!lyrics) {
                lyrics = await LyricsService.getLyricsByTitle(currentTrack.video_title)
            }
            currentLyrics.value = lyrics
        } catch (error) {
            console.error('Error cargando letras:', error)
            currentLyrics.value = null
        } finally {
            loadingLyrics.value = false
        }
    }

    return {
        isExpanded,
        position,
        isDragging,
        showLyrics,
        currentLyrics,
        loadingLyrics,
        toggleExpand,
        startDrag,
        toggleLyrics,
        loadLyrics
    }
}

import { ref } from 'vue'
import { usePlayerStore, type Track } from '@/stores/player-store'
import {
    initLocalAudio,
    playLocalTrack,
    playStream,
    destroyLocalAudio,
    onLocalAudioTimeUpdate,
    onLocalAudioEnded
} from '@/data/services/audio/LocalAudioService'
import { youtubeScraperService } from '@/data/services/youtube/YouTubeScraperService'

export const useLocalAudioPlayer = () => {
    const playerStore = usePlayerStore()
    const isLocalPlayback = ref(false)

    const playLocalTrackFromStore = async (track: Track, onProgress: (time: number, dur: number) => void, onEnded: () => void) => {
        if (!track.localPath) return
        destroyLocalAudio()
        isLocalPlayback.value = true

        try {
            initLocalAudio()
            onLocalAudioTimeUpdate(onProgress)
            onLocalAudioEnded(onEnded)
            
            await playLocalTrack(track.localPath)
            playerStore.play()
        } catch (error) {
            console.error('Error reproduciendo local:', error)
            isLocalPlayback.value = false
        }
    }

    const playThroughStreamBridge = async (videoId: string, onProgress: (time: number, dur: number) => void, onEnded: () => void): Promise<boolean> => {
        try {
            const streamUrl = await youtubeScraperService.getDirectStreamUrl(videoId)
            if (streamUrl) {
                console.log('[OK] [StreamBridge] Reproduciendo stream directo...')
                isLocalPlayback.value = true
                initLocalAudio()
                
                onLocalAudioTimeUpdate(onProgress)
                onLocalAudioEnded(onEnded)

                await playStream(streamUrl)
                playerStore.play()
                return true
            }
            return false
        } catch (error) {
            console.error('Fallo en el puente de audio:', error)
            return false
        }
    }

    return {
        isLocalPlayback,
        playLocalTrackFromStore,
        playThroughStreamBridge
    }
}

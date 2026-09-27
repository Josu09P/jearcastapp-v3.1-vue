import { ref, type Ref } from 'vue'
import { usePlayerStore } from '@/stores/player-store'
import Toastify from 'toastify-js'

export const useYouTubePlayer = (playerContainer: Ref<HTMLDivElement | null>) => {
    const playerStore = usePlayerStore()
    const ytPlayer = ref<YT.Player | null>(null)
    const isChangingTrack = ref(false)
    const isVeilBlurActive = ref(true)
    const currentTime = ref(0)
    const duration = ref(0)
    const progressValue = ref(0)
    
    let blurTimer: number | null = null
    let endingBlurInterval: number | null = null
    const BLUR_DURATION = 5000 // 5 segundos al iniciar
    const ENDING_BLUR_OFFSET = 20000 // 20 segundos antes de terminar

    const clearBlurTimers = () => {
        if (blurTimer) {
            window.clearTimeout(blurTimer)
            blurTimer = null
        }
        if (endingBlurInterval) {
            window.clearInterval(endingBlurInterval)
            endingBlurInterval = null
        }
    }

    const activateBlur = () => {
        isVeilBlurActive.value = true
        clearBlurTimers()
    }

    const deactivateBlur = () => {
        // Solo mantener blur si estamos comprobadamente en los últimos 20 segundos de una pista conocida (>30s)
        if (duration.value > 30) {
            const timeLeft = duration.value - currentTime.value
            if (timeLeft <= (ENDING_BLUR_OFFSET / 1000) && timeLeft > 0) {
                isVeilBlurActive.value = true
                clearBlurTimers()
                return
            }
        }
        isVeilBlurActive.value = false
        clearBlurTimers()
    }

    const scheduleBlurRemoval = (delayMs: number = BLUR_DURATION) => {
        clearBlurTimers()
        blurTimer = window.setTimeout(() => {
            deactivateBlur()
        }, delayMs)
    }

    const loadYouTubeAPI = (): Promise<void> => new Promise((resolve) => {
        if (window.YT?.Player) return resolve()
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
        window.onYouTubeIframeAPIReady = resolve
    })

    const forceIframeResize = () => {
        const applyResize = () => {
            const wrapper = (document.querySelector('.video-wrapper.fullscreen') as HTMLElement) 
                || (playerContainer.value ? playerContainer.value.closest('.video-wrapper') as HTMLElement : null)
            if (!wrapper) return

            const containerWidth = wrapper.offsetWidth
            const containerHeight = wrapper.offsetHeight

            if (containerWidth > 0 && containerHeight > 0) {
                try {
                    if (ytPlayer.value && typeof ytPlayer.value.setSize === 'function') {
                        ytPlayer.value.setSize(containerWidth, containerHeight)
                    }
                } catch (e) {
                    console.warn('Error ajustando tamaño del player:', e)
                }

                const iframe = (ytPlayer.value?.getIframe?.() || wrapper.querySelector('iframe')) as HTMLIFrameElement | null
                if (iframe) {
                    iframe.style.setProperty('width', '100%', 'important')
                    iframe.style.setProperty('height', '100%', 'important')
                    iframe.style.position = 'absolute'
                    iframe.style.top = '0'
                    iframe.style.left = '0'
                    iframe.style.right = '0'
                    iframe.style.bottom = '0'
                    iframe.style.objectFit = 'contain'
                }
            }
        }

        // Ejecutar ráfagas para capturar cambios de layout
        applyResize();
        [50, 100, 200, 400, 800, 1500].forEach(delay => window.setTimeout(applyResize, delay))
    }

    const hasError = ref(false)
    let lastErrorId = ''
    const resetErrorState = () => { 
        lastErrorId = ''
        hasError.value = false
    }

    const handleYouTubeError = async (errorCode: number, videoIdOnStack: string, retryCallback: (videoId: string) => Promise<boolean>) => {
        const currentStoreId = playerStore.currentTrack?.video_id
        
        if (!currentStoreId || videoIdOnStack !== currentStoreId) return
        if (lastErrorId === currentStoreId) return
        
        lastErrorId = currentStoreId
        hasError.value = true

        console.error(`[ERROR] [YT-ERROR] ${errorCode} para video ${currentStoreId}`)
        playerStore.pause()
        activateBlur()

        console.warn(`[WARN] Error de YouTube (${errorCode}) para video ${currentStoreId}. Intentando rescate por Audio Directo...`)
        const success = await retryCallback(currentStoreId)
        
        // VERIFICACIÓN CRÍTICA: ¿Seguimos en la misma canción tras el await?
        if (playerStore.currentTrack?.video_id !== currentStoreId) {
            console.warn('⚠️ [YT-ERROR] La canción cambió durante la recuperación. Cancelando salto automático.')
            return
        }

        if (!success) {
            console.warn('❌ [YT-ERROR] Falló la recuperación por audio directo. Saltando a la siguiente canción...')
            // Solo si el retry (audio local) también falla, saltamos
            playerStore.next()
        }
    }

    return {
        ytPlayer,
        isChangingTrack,
        isVeilBlurActive,
        currentTime,
        duration,
        progressValue,
        hasError,
        activateBlur,
        deactivateBlur,
        scheduleBlurRemoval,
        loadYouTubeAPI,
        forceIframeResize,
        handleYouTubeError,
        clearBlurTimers,
        resetErrorState
    }
}

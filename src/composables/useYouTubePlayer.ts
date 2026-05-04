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
        // Solo desactivar si no estamos en la fase final de la canción
        const timeLeft = duration.value - currentTime.value
        if (timeLeft > (ENDING_BLUR_OFFSET / 1000) + 1) {
            isVeilBlurActive.value = false
        }
        clearBlurTimers()
    }

    const scheduleBlurRemoval = () => {
        clearBlurTimers()
        // El conteo solo debe ser efectivo si el video está realmente reproduciéndose
        blurTimer = window.setTimeout(() => {
            deactivateBlur()
        }, BLUR_DURATION)
    }

    const loadYouTubeAPI = (): Promise<void> => new Promise((resolve) => {
        if (window.YT?.Player) return resolve()
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
        window.onYouTubeIframeAPIReady = resolve
    })

    const forceIframeResize = () => {
        if (!playerContainer.value || !ytPlayer.value) return

        const applyResize = () => {
            if (!playerContainer.value || !ytPlayer.value) return
            const wrapper = playerContainer.value.parentElement
            if (!wrapper) return

            const containerWidth = wrapper.offsetWidth
            const containerHeight = wrapper.offsetHeight

            if (containerWidth > 0 && containerHeight > 0) {
                try {
                    ytPlayer.value.setSize(containerWidth, containerHeight)
                    const iframe = playerContainer.value.querySelector('iframe')
                    if (iframe) {
                        iframe.style.setProperty('width', '100%', 'important')
                        iframe.style.setProperty('height', '100%', 'important')
                        iframe.style.position = 'absolute'
                        iframe.style.top = '0'
                        iframe.style.left = '0'
                    }
                } catch (e) {
                    console.warn('Error ajustando tamaño del player:', e)
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

        if ([2, 5, 101, 150].includes(errorCode)) {
            console.warn(`[WARN] Error de restricción (${errorCode}). Intentando Audio Directo...`)
            // Intentamos recuperar silenciosamente
            const success = await retryCallback(currentStoreId)
            
            // VERIFICACIÓN CRÍTICA: ¿Seguimos en la misma canción tras el await?
            if (playerStore.currentTrack?.video_id !== currentStoreId) {
                console.warn('⚠️ [YT-ERROR] La canción cambió durante la recuperación. Cancelando salto automático.')
                return
            }

            if (!success) {
                // Solo si el retry (audio local) también falla, saltamos
                playerStore.next()
            }
        } else {
            // Errores no relacionados con copyright (red, etc.)
            // También verificamos aquí por seguridad
            if (playerStore.currentTrack?.video_id === currentStoreId) {
                playerStore.next()
            }
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

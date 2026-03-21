<template>
    <Transition :name="transitionName">
        <div v-if="currentTrack" class="unified-player" :class="{
            'fullscreen-mode': playerStore.isFullScreen,
            'mini-mode': !playerStore.isFullScreen
        }" :style="!playerStore.isFullScreen ? { top: `${position.y}px`, left: `${position.x}px` } : {}">

            <!-- Background Blur (solo en fullscreen) -->
            <div v-if="playerStore.isFullScreen" class="background-blur"
                :style="{ backgroundImage: `url(${currentTrack?.video_thumbnail})` }">
            </div>

            <!-- Contenedor principal -->
            <div class="player-content" :class="{ 'fullscreen': playerStore.isFullScreen }">
                <!-- HEADER - Fullscreen -->
                <div v-if="playerStore.isFullScreen"
                    class="header-fullscreen d-flex justify-content-between align-items-center">
                    <button @click="closeFullScreen" class="btn-close-fs">
                        <i class="bi bi-chevron-down"></i>
                    </button>
                    <div class="text-center" style="margin-top: 20px;">
                        <small class="text-uppercase tracking-widest text-secondary opacity-75">
                            Reproduciendo ahora
                        </small>
                        <h5 class="mb-0 text-white fw-bold">{{ currentTrack?.video_title }}</h5>
                    </div>
                    <div style="width: 40px;"></div>
                </div>

                <!-- HEADER - Mini Player (flotante) -->
                <div v-else class="header-mini d-flex justify-content-between align-items-center"
                    @mousedown="startDrag">
                    <span class="title text-truncate">{{ currentTrack?.video_title || 'Sin reproducción' }}</span>
                    <div class="d-flex gap-2">
                        <button @click="playerStore.openFullScreen()" class="btn-action-mini">
                            <i class="bi bi-fullscreen"></i>
                        </button>
                        <button @click="toggleExpand" class="btn-action-mini">
                            <i :class="isExpanded ? 'bi bi-chevron-down' : 'bi bi-chevron-up'"></i>
                        </button>
                    </div>
                </div>

                <!-- SECCIÓN DE VIDEO/ANIMACIÓN -->
                <div class="video-section" :class="{
                    'fullscreen': playerStore.isFullScreen,
                    'mini': !playerStore.isFullScreen && isExpanded
                }">
                    <!-- Video Player (siempre presente pero oculto visualmente en mini) -->
                    <div class="video-wrapper" :class="{
                        'fullscreen': playerStore.isFullScreen,
                        'mini-hidden': !playerStore.isFullScreen
                    }">
                        <div ref="playerContainer" class="iframe-element"></div>
                        <!-- Velo con blur (solo visible en fullscreen) -->
                        <div v-if="playerStore.isFullScreen" class="video-veil"
                            :class="{ 'blur-active': isVeilBlurActive }"></div>
                    </div>

                    <!-- Lottie Animation (solo en mini player) -->
                    <div v-if="!playerStore.isFullScreen && isExpanded" class="lottie-container">
                        <div ref="lottieContainer" class="lottie-animation"></div>
                    </div>
                </div>

                <!-- INFO DEL AUTOR - CORREGIDO -->
                <div v-if="currentTrack" class="author-info-section" :class="{
                    'fullscreen': playerStore.isFullScreen,
                    'mini': !playerStore.isFullScreen
                }">
                    <div class="author-info-content d-flex align-items-center gap-2">
                        <i class="bi bi-person-circle author-icon"></i>
                        <span class="author-name">{{ currentTrack.video_author || 'Cargando artista...' }}</span>
                        <span v-if="currentTrack.video_author" class="author-badge">Artista</span>
                        <span v-else class="author-badge bg-secondary bg-opacity-25">Cargando</span>
                    </div>
                </div>

                <!-- CONTROLES -->
                <div class="controls-wrapper" :class="{ 'fullscreen': playerStore.isFullScreen }">
                    <!-- Barra de progreso -->
                    <div class="progress-container" :class="{ 'fullscreen': playerStore.isFullScreen }">
                        <input type="range" min="0" max="100" step="0.1" v-model="progressValue" @input="handleSeek"
                            @mousedown="handleSeekStart" @mouseup="handleSeekEnd" class="form-range custom-range" />
                        <div class="d-flex justify-content-between mt-2 text-secondary font-monospace">
                            <span>{{ currentTimeFormatted }}</span>
                            <span>{{ durationFormatted }}</span>
                        </div>
                    </div>

                    <!-- Botones de control -->
                    <div class="buttons-container" :class="{ 'fullscreen': playerStore.isFullScreen }">
                        <button @click="toggleShuffle" class="control-btn secondary"
                            :class="{ 'active': playerStore.isShuffling }">
                            <i class="bi bi-shuffle"></i>
                        </button>

                        <button @click="prev" class="control-btn main">
                            <i class="bi bi-skip-start-fill"></i>
                        </button>

                        <button @click="togglePlayPause" class="control-btn play">
                            <i :class="isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill'"></i>
                        </button>

                        <button @click="next" class="control-btn main">
                            <i class="bi bi-skip-end-fill"></i>
                        </button>

                        <button @click="toggleRepeat" class="control-btn secondary"
                            :class="{ 'active': isRepeatActive }">
                            <i class="bi bi-repeat"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { usePlayerStore, type Track } from '@/stores/player-store'
import lottie from 'lottie-web'
import { useAnimationStore } from '@/stores/animation-store';

/* ==================== TIPOS ==================== */
interface Position { x: number; y: number }
interface DragOffset { x: number; y: number }

declare global {
    interface Window {
        YT: typeof YT
        onYouTubeIframeAPIReady: () => void
    }
}

declare namespace YT {
    enum PlayerState { UNSTARTED = -1, ENDED = 0, PLAYING = 1, PAUSED = 2, BUFFERING = 3, CUED = 5 }
    class Player {
        constructor(elementId: string | HTMLElement, options: any)
        playVideo(): void; pauseVideo(): void; mute(): void; unMute(): void
        setVolume(volume: number): void; setSize(width: number, height: number): void
        destroy(): void; getCurrentTime(): number; getDuration(): number
        getPlayerState(): PlayerState; seekTo(seconds: number, allowSeekAhead: boolean): void
    }
}

/* ==================== CONSTANTES ==================== */
const BLUR_DURATION = 5000
const ENDING_BLUR_OFFSET = 15000
const PLAYER_WIDTH = 300
const PLAYER_HEIGHT = 170
const MINI_PLAYER_OFFSET = 20
const RESIZE_DELAYS = [0, 50, 100, 200, 300] as const

/* ==================== STORE ==================== */
const playerStore = usePlayerStore()
const currentTrack = computed(() => playerStore.currentTrack)
const isPlaying = computed(() => playerStore.isPlaying)

/* ==================== REFS ==================== */
const playerContainer = ref<HTMLDivElement | null>(null)
const lottieContainer = ref<HTMLElement | null>(null)

/* ==================== ESTADO UI ==================== */
const isExpanded = ref(true)
const position = ref<Position>({
    x: MINI_PLAYER_OFFSET,
    y: window.innerHeight - PLAYER_HEIGHT - MINI_PLAYER_OFFSET
})
const isDragging = ref(false)
const dragOffset = ref<DragOffset>({ x: 0, y: 0 })

/* ==================== ESTADO REPRODUCCIÓN ==================== */
const currentTime = ref(0)
const duration = ref(0)
const progressValue = ref(0)
const isRepeatActive = ref(false)
const isSeeking = ref(false)

/* ==================== ESTADO VELO ==================== */
const isVeilBlurActive = ref(true)
let blurTimer: number | null = null
let endingBlurInterval: number | null = null

/* ==================== YT PLAYER ==================== */
let ytPlayer: YT.Player | null = null
let animationFrameId: number | null = null
let lottieInstance: any = null
let resizeObserver: ResizeObserver | null = null

/* ==================== COMPUTED ==================== */
const currentTimeFormatted = computed(() => formatTime(currentTime.value))
const durationFormatted = computed(() => formatTime(duration.value))
const transitionName = computed(() => playerStore.isFullScreen ? 'slide-up' : 'slide-down')

/* ==================== UTILIDADES ==================== */
const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const clearBlurTimers = (): void => {
    if (blurTimer) clearTimeout(blurTimer)
    if (endingBlurInterval) clearInterval(endingBlurInterval)
    blurTimer = null; endingBlurInterval = null
}

const activateBlur = (): void => { isVeilBlurActive.value = true; clearBlurTimers() }
const deactivateBlur = (): void => { if (isVeilBlurActive.value) { isVeilBlurActive.value = false; clearBlurTimers() } }

const scheduleBlurRemoval = (): void => {
    clearBlurTimers()
    blurTimer = window.setTimeout(deactivateBlur, BLUR_DURATION)
}

const checkEndingBlur = (): void => {
    if (!ytPlayer || !duration.value) return
    const remainingTime = duration.value - currentTime.value
    if (remainingTime <= ENDING_BLUR_OFFSET / 1000 && remainingTime > 0) activateBlur()
}

const startEndingBlurCheck = (): void => {
    if (endingBlurInterval) clearInterval(endingBlurInterval)
    endingBlurInterval = window.setInterval(checkEndingBlur, 1000)
}

/* ==================== IFRAME RESIZE ==================== */
const forceIframeResize = (): void => {
    if (!playerContainer.value || !ytPlayer) return

    const applyResize = () => {
        if (!playerContainer.value || !ytPlayer) return

        const containerWidth = playerContainer.value.clientWidth
        const containerHeight = playerContainer.value.clientHeight

        if (containerWidth > 0 && containerHeight > 0) {
            ytPlayer.setSize(containerWidth, containerHeight)

            const iframe = playerContainer.value.querySelector('iframe')
            if (iframe) {
                iframe.removeAttribute('width')
                iframe.removeAttribute('height')
                Object.assign(iframe.style, {
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    border: '0',
                    objectFit: 'contain'
                })
            }
        }
    }

    // Aplicar resize múltiples veces para asegurar
    RESIZE_DELAYS.forEach(delay => {
        setTimeout(applyResize, delay)
    })
}

/* ==================== YOUTUBE API ==================== */
const loadYouTubeAPI = (): Promise<void> => new Promise((resolve) => {
    if (window.YT?.Player) return resolve()
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = resolve
})

const setupResizeObserver = (): void => {
    if (!playerContainer.value) return
    resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            if (ytPlayer && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                ytPlayer.setSize(entry.contentRect.width, entry.contentRect.height)
                forceIframeResize()
            }
        }
    })
    resizeObserver.observe(playerContainer.value)
}

const handlePlayerReady = (event: any): void => {
    event.target.unMute()
    event.target.setVolume(100)
    event.target.playVideo()

    // Obtener información del video
    const videoData = event.target.getVideoData()

    // Usar la acción del store para actualizar el autor
    if (videoData && videoData.author) {
        playerStore.updateCurrentTrackAuthor(videoData.author)
    }

    startProgressLoop()
    setupResizeObserver()

    // Asegurar que el blur está activo al inicio
    if (playerStore.isFullScreen) {
        activateBlur()
        // El scheduleBlurRemoval se llamará cuando empiece a reproducir (PLAYING)
    }

    forceIframeResize()
}

const handlePlayerStateChange = (state: number): void => {
    switch (state) {
        case window.YT.PlayerState.PLAYING:
            playerStore.play()
            lottieInstance?.play()

            // CORREGIDO: Solo desactivar blur si NO estamos en fullscreen o si es por seek
            if (playerStore.isFullScreen) {
                if (isSeeking.value) {
                    // Si es por seek, no hacer nada con el blur
                } else {
                    // Si es reproducción normal, mantener el blur y programar su remoción
                    // No desactivamos el blur inmediatamente
                    scheduleBlurRemoval()
                }
            }

            if (playerStore.isFullScreen) startEndingBlurCheck()
            break

        case window.YT.PlayerState.PAUSED:
            playerStore.pause()
            lottieInstance?.pause()
            if (playerStore.isFullScreen) {
                activateBlur() // Activar blur al pausar
            }
            break

        case window.YT.PlayerState.ENDED:
            isRepeatActive.value ? ytPlayer?.seekTo(0, true) && ytPlayer?.playVideo() : playerStore.next()
            break
    }
}

// Función para obtener autor antes de cargar el video
const prefetchAuthor = async (videoId: string) => {
    try {
        const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
        const data = await response.json()
        if (data.author_name && currentTrack.value) {
            playerStore.updateCurrentTrackAuthor(data.author_name)
        }
    } catch (error) {
        console.error('Error prefetching author:', error)
    }
}

const createPlayer = (videoId: string): void => {
    if (!playerContainer.value) return

    if (ytPlayer) {
        ytPlayer.destroy();
        ytPlayer = null
    }

    while (playerContainer.value.firstChild) {
        playerContainer.value.removeChild(playerContainer.value.firstChild)
    }

    ytPlayer = new window.YT.Player(playerContainer.value, {
        videoId,
        playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            cc_load_policy: 0
        },
        host: 'https://www.youtube-nocookie.com',
        events: {
            onReady: handlePlayerReady,
            onStateChange: (e: any) => handlePlayerStateChange(e.data)
        }
    })
}

// Función adicional para obtener autor de YouTube (opcional pero recomendado)
const fetchVideoAuthor = async (videoId: string): Promise<string | null> => {
    try {
        // Usar una API gratuita como noembed para obtener metadata
        const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
        const data = await response.json()
        return data.author_name || null
    } catch (error) {
        console.error('Error obteniendo autor:', error)
        return null
    }
}

// Cuando cargas una playlist, puedes precargar los autores
const loadPlaylistWithAuthors = async (tracks: Track[]) => {
    for (const track of tracks) {
        if (!track.video_author) {
            const author = await fetchVideoAuthor(track.video_id)
            if (author) {
                track.video_author = author
            }
        }
    }
    playerStore.setPlaylist(tracks)
}

/* ==================== LOOP DE PROGRESO ==================== */
const startProgressLoop = (): void => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    const update = () => {
        if (ytPlayer) {
            try {
                const time = ytPlayer.getCurrentTime()
                const total = ytPlayer.getDuration()
                if (!isNaN(time) && !isNaN(total) && total > 0) {
                    currentTime.value = time
                    duration.value = total
                    if (!isSeeking.value) progressValue.value = (time / total) * 100
                }
            } catch (e) { console.error('Error updating progress:', e) }
        }
        animationFrameId = requestAnimationFrame(update)
    }
    animationFrameId = requestAnimationFrame(update)
}

/* ==================== LOTTIE ==================== */
const animationStore = useAnimationStore()

const setupLottie = (): void => {
    if (lottieInstance) lottieInstance.destroy()
    if (lottieContainer.value && !playerStore.isFullScreen) {
        const currentAnim = animationStore.currentAnimation
        lottieInstance = lottie.loadAnimation({
            container: lottieContainer.value,
            renderer: 'svg',
            loop: true,
            autoplay: isPlaying.value,
            animationData: currentAnim.data
        })
    }
}

/* ==================== CONTROLES ==================== */
const togglePlayPause = (): void => {
    if (!ytPlayer) return
    ytPlayer.getPlayerState() === window.YT.PlayerState.PLAYING
        ? ytPlayer.pauseVideo()
        : ytPlayer.playVideo()
}

const handleSeek = (): void => {
    if (!ytPlayer || !isSeeking.value) return
    const total = ytPlayer.getDuration()
    if (total > 0) ytPlayer.seekTo((progressValue.value / 100) * total, true)
}

const handleSeekStart = (): void => { isSeeking.value = true }
const handleSeekEnd = (): void => {
    isSeeking.value = false
    handleSeek()
    if (isPlaying.value && playerStore.isFullScreen) {
        deactivateBlur();
        scheduleBlurRemoval()
    }
}

const next = (): void => playerStore.next()
const prev = (): void => playerStore.prev()
const toggleShuffle = (): void => playerStore.toggleShuffle()
const toggleRepeat = (): void => { isRepeatActive.value = !isRepeatActive.value }

const toggleExpand = (): void => {
    isExpanded.value = !isExpanded.value
    if (isExpanded.value && !playerStore.isFullScreen) nextTick(setupLottie)
}

const closeFullScreen = (): void => {
    playerStore.closeFullScreen()
    position.value = {
        x: MINI_PLAYER_OFFSET,
        y: window.innerHeight - PLAYER_HEIGHT - MINI_PLAYER_OFFSET
    }
    if (isExpanded.value) nextTick(setupLottie)
}

/* ==================== DRAG ==================== */
const startDrag = (e: MouseEvent): void => {
    if (playerStore.isFullScreen) return
    isDragging.value = true
    dragOffset.value = { x: e.clientX - position.value.x, y: e.clientY - position.value.y }
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', stopDrag)
}

const onDrag = (e: MouseEvent): void => {
    if (!isDragging.value || playerStore.isFullScreen) return
    position.value = { x: e.clientX - dragOffset.value.x, y: e.clientY - dragOffset.value.y }
}

const stopDrag = (): void => {
    isDragging.value = false
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', stopDrag)
}

/* ==================== KEYBOARD ==================== */
const handleKeyPress = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
    if (e.code === 'Space') { e.preventDefault(); togglePlayPause() }
}

/* ==================== WATCHERS ==================== */
watch(() => playerStore.isFullScreen, async (isFull) => {
    if (isFull) {
        deactivateBlur()
        scheduleBlurRemoval()

        // CORRECCIÓN: Obtener el videoId del currentTrack
        const currentVideoId = currentTrack.value?.video_id
        if (currentVideoId) {
            prefetchAuthor(currentVideoId)
        }

        // Forzar resize múltiples veces al entrar en fullscreen
        await nextTick()
        forceIframeResize()

        // También forzar después de que la transición termine
        setTimeout(() => {
            forceIframeResize()
        }, 400)

    } else {
        position.value = {
            x: MINI_PLAYER_OFFSET,
            y: window.innerHeight - PLAYER_HEIGHT - MINI_PLAYER_OFFSET
        }
        if (isExpanded.value) {
            await nextTick()
            setupLottie()
        }
    }
})

watch(() => currentTrack.value?.video_id, async (videoId) => {
    if (!videoId) return
    // Activar blur al cambiar de canción
    if (playerStore.isFullScreen) {
        activateBlur()
        // No programamos remoción aquí porque esperamos a que empiece a reproducir
    }
    prefetchAuthor(videoId)
    await loadYouTubeAPI()
    await nextTick()
    createPlayer(videoId)
}, { immediate: true })

// Watch para cambiar la animación en tiempo real
watch(() => animationStore.currentAnimationId, async (newId, oldId) => {
    if (newId !== oldId && !playerStore.isFullScreen && isExpanded.value) {
        // Pequeño delay para asegurar que el DOM esté listo
        await nextTick()
        setupLottie()
    }
})
/* ==================== LIFECYCLE ==================== */
onMounted(() => {
    window.addEventListener('keydown', handleKeyPress)
    if (!playerStore.isFullScreen && isExpanded.value) setupLottie()
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyPress)
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    if (resizeObserver) resizeObserver.disconnect()
    clearBlurTimers()
    lottieInstance?.destroy()
    // No destruimos ytPlayer aquí para mantener el audio
})
</script>
<style scoped>
@import url('@/assets/css/player-styles.css');

/* ==================== INFO DEL AUTOR - VERSIÓN SIMPLE Y CENTRADA ==================== */
.author-info-section {
    width: 100%;
    margin: 8px 0;
    display: flex;
    justify-content: center;
    /* Centrar horizontalmente */
}

.author-info-section.fullscreen {
    margin: 16px 0 12px 0;
    /* Más espacio en fullscreen */
}

/* Versión mini player - CENTRADA */
.author-info-section.mini {
    display: flex;
    justify-content: center;
    width: 100%;
    margin: 8px auto 4px auto !important;
    padding: 4px 0;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1.3rem;
    background: transparent;
}

.author-info-section.mini .author-info-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: auto;
    margin: 0 auto;
    padding: 0;
}

.author-info-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 4px 0;
    /* Sin fondo, sin blur, sin bordes */
    width: fit-content;
    max-width: 90%;
    /* Limitar ancho en móviles */
}

.author-icon {
    font-size: 1.1rem;
    color: #b3b3b3;
    /* Gris suave */
    flex-shrink: 0;
}

.author-name {
    color: #e0e0e0;
    /* Blanco suave */
    font-size: 0.9rem;
    font-weight: 400;
    letter-spacing: 0.3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 250px;
}

.author-badge {
    color: #1db954;
    /* Verde Spotify */
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: transparent;
    /* Sin fondo */
    border: none;
    padding: 0;
    flex-shrink: 0;
}

.author-badge.bg-secondary {
    color: #808080 !important;
    /* Gris para estado "Cargando" */
    background: transparent !important;
    border: none !important;
}

/* Versión mini player */
.author-info-section.mini .author-icon {
    font-size: 0.9rem;
}

.author-info-section.mini .author-name {
    font-size: 0.75rem;
    max-width: 150px;
}

.author-info-section.mini .author-badge {
    font-size: 0.6rem;
}

/* Responsive */
@media (max-width: 768px) {
    .author-info-section.fullscreen .author-name {
        max-width: 200px;
    }
}

@media (max-width: 480px) {
    .author-info-section.fullscreen .author-name {
        max-width: 140px;
        font-size: 0.8rem;
    }

    .author-info-section.fullscreen .author-badge {
        display: inline-block;
        /* Mantener badge incluso en móviles */
        font-size: 0.65rem;
    }

    .author-icon {
        font-size: 1rem;
    }
}
</style>
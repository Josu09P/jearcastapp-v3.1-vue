<template>
    <Transition :name="transitionName">
        <div v-if="currentTrack" class="unified-player" :class="{
            'fullscreen-mode': playerStore.isFullScreen,
            'mini-mode': !playerStore.isFullScreen
        }" :style="!playerStore.isFullScreen ? { top: `${position.y}px`, left: `${position.x}px` } : {}">

            <!-- Background Blur -->
            <div v-if="playerStore.isFullScreen" class="background-blur"
                :style="{ backgroundImage: `url(${currentTrack?.video_thumbnail})` }">
            </div>

            <!-- Contenedor principal -->
            <div class="player-content" :class="{ 'fullscreen': playerStore.isFullScreen }">
                <!-- HEADER - Fullscreen (Alineado en una sola línea) -->
                <div v-if="playerStore.isFullScreen" class="header-fullscreen d-flex align-items-center gap-2 gap-md-3">

                    <!-- Botón Cerrar/Mini -->
                    <button @click="closeFullScreen" class="btn-close-fs flex-shrink-0">
                        <i class="bi bi-chevron-down"></i>
                    </button>

                    <!-- Título Centrado -->
                    <div class="title-container">
                        <h6 class="mb-0 text-white fw-bold text-truncate"
                            style="font-size: clamp(0.9rem, 2vw, 1.1rem);">
                            {{ currentTrack?.video_title }}
                        </h6>
                    </div>

                    <!-- Botón Letras -->
                    <div class="lyrics-toggle flex-shrink-0">
                        <button @click="toggleLyrics(currentTrack)" class="lyrics-btn" :class="{ active: showLyrics }"
                            title="Letras">
                            <i class="bi bi-card-text" style="font-size: clamp(1rem, 1.5vw, 1.2rem);"></i>
                        </button>
                    </div>
                </div>

                <!-- HEADER - Mini Player -->
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
                    'with-lyrics': playerStore.isFullScreen && showLyrics,
                    'mini': !playerStore.isFullScreen && isExpanded
                }">
                    <!-- Video wrapper -->
                    <div class="video-wrapper" :class="{
                        'fullscreen': playerStore.isFullScreen,
                        'mini-hidden': !playerStore.isFullScreen
                    }">
                        <div v-if="!isLocalPlayback" ref="playerContainer" class="iframe-element"></div>
                        <div v-else class="local-player-placeholder">
                            <i class="bi bi-file-music-fill"></i>
                            <p>{{ currentTrack?.video_title }}</p>
                            <small>{{ currentTrack?.video_author }}</small>
                        </div>
                        <div class="video-veil" :class="{ 'blur-active': isVeilBlurActive }"></div>
                    </div>

                    <!-- Lottie Animation (solo en mini player) -->
                    <div v-if="!playerStore.isFullScreen && isExpanded" class="lottie-container">
                        <div ref="lottieContainer" class="lottie-animation"></div>
                    </div>
                </div>

                <!-- INFO DEL AUTOR -->
                <div v-if="currentTrack" class="author-info-section" :class="{
                    'fullscreen': playerStore.isFullScreen,
                    'mini': !playerStore.isFullScreen
                }">
                    <div class="author-info-content d-flex align-items-center gap-2">
                        <i class="bi bi-person-circle author-icon" style="color: white !important;"></i>
                        <span class="author-name">{{ currentTrack.video_author || 'Cargando artista...' }}</span>
                        <span v-if="currentTrack.video_author" class="author-badge">Artista</span>
                        <span v-else class="author-badge bg-secondary bg-opacity-25">Cargando</span>
                    </div>
                </div>

                <!-- CONTROLES -->
                <div class="controls-wrapper" :class="{ 'fullscreen': playerStore.isFullScreen }">
                    <div class="progress-container" :class="{ 'fullscreen': playerStore.isFullScreen }">
                        <input type="range" min="0" max="100" step="0.1" v-model="progressValue" @input="handleSeek"
                            @mousedown="handleSeekStart" @mouseup="handleSeekEnd" class="form-range custom-range" />
                        <div class="d-flex justify-content-between mt-2 text-secondary font-monospace">
                            <span>{{ currentTimeFormatted }}</span>
                            <span>{{ durationFormatted }}</span>
                        </div>
                    </div>

                    <div class="controls-row">
                        <div class="buttons-container" :class="{ 'fullscreen': playerStore.isFullScreen }">
                            <!-- Shuffle: Siempre a la izquierda -->
                            <button @click="toggleShuffle" class="control-btn secondary"
                                :class="{ 'active': playerStore.isShuffling }">
                                <i class="bi bi-shuffle"></i>
                            </button>

                            <!-- Repeat: Lado izquierdo solo en Fullscreen -->
                            <button v-if="playerStore.isFullScreen" @click="toggleRepeat" class="control-btn secondary"
                                :class="{ 'active': isRepeatActive }">
                                <i class="bi bi-repeat"></i>
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

                            <!-- Repeat: Lado derecho solo en Mini Player para balancear -->
                            <button v-if="!playerStore.isFullScreen" @click="toggleRepeat" class="control-btn secondary"
                                :class="{ 'active': isRepeatActive }">
                                <i class="bi bi-repeat"></i>
                            </button>

                            <AudioControl v-if="playerStore.isFullScreen" @volume-change="handleVolumeChange"
                                @eq-change="handleEqChange" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Panel de prueba de letras - SOLO PARA DEBUG -->
            <div v-if="showDebugLyrics" class="debug-lyrics-overlay d-none" @click="showDebugLyrics = false">
                <div class="debug-lyrics-content" @click.stop>
                    <button class="debug-close" @click="showDebugLyrics = false">✕</button>
                    <h3>{{ currentTrack?.video_title || 'Letras de prueba' }}</h3>
                    <h4>Artista: {{ currentTrack?.video_author || 'Desconocido' }}</h4>
                    <div class="debug-divider"></div>
                    <div class="debug-info">
                        <p><strong>Estado:</strong> {{ currentLyrics ? 'Letras cargadas' : 'Sin letras' }}</p>
                        <p><strong>Líneas sincronizadas:</strong> {{ currentLyrics?.syncedLyrics.length || 0 }}</p>
                        <p><strong>Letras simples:</strong> {{ currentLyrics?.plainLyrics.length || 0 }} caracteres
                        </p>
                    </div>
                    <div class="debug-divider"></div>
                    <div class="debug-lines">
                        <div v-if="currentLyrics?.syncedLyrics.length" class="debug-section">
                            <h5>Letras sincronizadas (primeras 15 líneas):</h5>
                            <div v-for="(line, idx) in currentLyrics.syncedLyrics.slice(0, 15)" :key="idx"
                                class="debug-line">
                                <span class="debug-time">[{{ formatTime(line.time) }}]</span>
                                {{ line.text }}
                            </div>
                        </div>
                        <div v-else-if="currentLyrics?.plainLyrics" class="debug-section">
                            <h5>Letras simples:</h5>
                            <div class="debug-line">{{ currentLyrics.plainLyrics.substring(0, 500) }}...</div>
                        </div>
                        <div v-else class="debug-section">
                            <h5>No hay letras disponibles para esta canción</h5>
                            <p>Intentando buscar con: "{{ currentTrack?.video_title }}"</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- COMPONENTE DE LETRAS DENTRO DEL REPRODUCTOR -->
            <LyricsDisplay :lyrics="currentLyrics" :loading="loadingLyrics" :visible="showLyrics"
                :current-time="currentTime" @close="closeLyrics" />
        </div>
    </Transition>
</template>
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { usePlayerStore, type Track } from '@/stores/player-store'
import lottie from 'lottie-web'
import { useAnimationStore } from '@/stores/animation-store'
import { useUserStore } from '@/stores/user'
import { useUserDataStore } from '@/stores/userDataStore'
import { youtubeScraperService } from '@/data/services/youtube/YouTubeScraperService'
import { searchSongsByArtist } from '@/data/services/youtube/SearchByArtistService'
import { addToRecentlyPlayed } from '@/data/services/local/RecentlyPlayedService'
import {
    initLocalAudio,
    playLocalTrack,
    resumeLocalAudio,
    pauseLocalAudio,
    setLocalAudioCurrentTime,
    getLocalAudioCurrentTime,
    getLocalAudioDuration,
    onLocalAudioTimeUpdate,
    onLocalAudioEnded,
    destroyLocalAudio
} from '@/data/services/audio/LocalAudioService'
import { useYouTubePlayer } from '@/composables/useYouTubePlayer'
import { useLocalAudioPlayer } from '@/composables/useLocalAudioPlayer'
import { usePlayerUI } from '@/composables/usePlayerUI'
import { useDiscovery } from '@/composables/useDiscovery'
import LyricsDisplay from '../LyricsDisplay.vue'
import AudioControl from './AudioControl.vue'
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

const showToast = (text: string, isError: boolean = false) => {
    Toastify({
        text,
        duration: 3000,
        gravity: 'top',
        position: 'right',
        className: isError ? 'toast-glass bg-danger' : 'toast-glass'
    }).showToast()
}

/* ==================== CONSTANTES ==================== */
const PLAYER_WIDTH = 300
const PLAYER_HEIGHT = 170
const ENDING_BLUR_OFFSET = 20000 // 20 segundos antes de terminar

/* ==================== STORES ==================== */
const playerStore = usePlayerStore()
const userDataStore = useUserDataStore()
const userStore = useUserStore()
const animationStore = useAnimationStore()

const currentTrack = computed(() => playerStore.currentTrack)
const isPlaying = computed(() => playerStore.isPlaying)

/* ==================== REFS ==================== */
const playerContainer = ref<HTMLDivElement | null>(null)
const lottieContainer = ref<HTMLElement | null>(null)
const lastMiniPosition = ref<{ x: number; y: number } | null>(null)

/* ==================== COMPOSABLES ==================== */
const {
    ytPlayer,
    isChangingTrack,
    isVeilBlurActive,
    currentTime,
    duration,
    progressValue,
    hasError,
    activateBlur,
    scheduleBlurRemoval,
    loadYouTubeAPI,
    forceIframeResize,
    handleYouTubeError,
    clearBlurTimers,
    resetErrorState
} = useYouTubePlayer(playerContainer)

const {
    isLocalPlayback,
    playLocalTrackFromStore,
    playThroughStreamBridge
} = useLocalAudioPlayer()

const {
    isExpanded,
    position,
    showLyrics,
    currentLyrics,
    loadingLyrics,
    toggleExpand,
    startDrag,
    toggleLyrics,
    loadLyrics
} = usePlayerUI()

const { isExpanding, expandPlaylistWithMoreSongs } = useDiscovery()

const showDebugLyrics = ref(false)
const closeLyrics = () => { showLyrics.value = false }

const closeFullScreen = (): void => {
    playerStore.closeFullScreen()
    if (lastMiniPosition.value) {
        position.value = lastMiniPosition.value
        lastMiniPosition.value = null
    } else {
        position.value = {
            x: 20, // MINI_PLAYER_OFFSET
            y: window.innerHeight - 170 - 20 // PLAYER_HEIGHT - MINI_PLAYER_OFFSET
        }
    }
    if (isExpanded.value) nextTick(setupLottie)
}

/* ==================== UTILIDADES ==================== */
const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const currentTimeFormatted = computed(() => formatTime(currentTime.value))
const durationFormatted = computed(() => formatTime(duration.value))
const transitionName = computed(() => playerStore.isFullScreen ? 'slide-up' : 'slide-down')

/* ==================== CONTROLES DE AUDIO ==================== */
const handleVolumeChange = (value: number) => {
    if (ytPlayer.value) ytPlayer.value.setVolume(value)
    // Para audio local, el servicio ya lo maneja o se puede implementar vía IPC
}

const handleEqChange = (values: any) => {
    if (window.electron?.ipcRenderer?.send) {
        window.electron.ipcRenderer.send('audio-eq-changed', values)
    }
}

const createPlayer = (videoId: string): void => {
    if (!playerContainer.value) return

    // RESET DE ESTADO DE ERROR: Limpiamos bloqueos previos antes de intentar nueva carga
    resetErrorState()

    // HARD RESET: Siempre destruimos el player anterior y limpiamos el DOM.
    // Aunque consume un poco más de recursos, garantiza que el Iframe inicie con 
    // estilos limpios y sin rastro de errores de copyright de la canción anterior.
    if (ytPlayer.value) {
        try { 
            ytPlayer.value.destroy() 
        } catch (e) { 
            console.warn('Error al destruir player:', e)
        }
        ytPlayer.value = null
    }

    // Limpiar contenedor DOM de rastro de Iframes anteriores
    while (playerContainer.value.firstChild) {
        playerContainer.value.removeChild(playerContainer.value.firstChild)
    }

    ytPlayer.value = new window.YT.Player(playerContainer.value, {
        videoId,
        playerVars: {
            autoplay: 1, controls: 0, modestbranding: 1, rel: 0,
            enablejsapi: 1, origin: window.location.origin, disablekb: 1,
            fs: 0, iv_load_policy: 3, cc_load_policy: 0, quality: 'hd1080'
        },
        events: {
            onReady: (e: any) => {
                e.target.unMute()
                e.target.setVolume(100)
                e.target.playVideo()
                const videoData = e.target.getVideoData()
                if (videoData?.author) playerStore.updateCurrentTrackAuthor(videoData.author)
                startProgressLoop()
                activateBlur()
                forceIframeResize()
            },
            onStateChange: (e: any) => handlePlayerStateChange(e.data),
            onError: (e: any) => handleYouTubeError(e.data, videoId,
                async (id) => {
                    // Verificación de seguridad: solo recuperar si el video sigue siendo el actual
                    if (playerStore.currentTrack?.video_id !== id) return false

                    // Destrucción total del Iframe para dar paso al audio
                    if (ytPlayer.value) {
                        try { ytPlayer.value.destroy(); ytPlayer.value = null } catch (err) {}
                    }
                    
                    // Activamos inmediatamente el estado local para que los controles respondan
                    isLocalPlayback.value = true

                    const success = await playThroughStreamBridge(id, (t, d) => {
                        currentTime.value = t; duration.value = d; progressValue.value = (t / d) * 100
                    }, () => { 
                        if (playerStore.currentTrack?.video_id === id) {
                            isLocalPlayback.value = false; 
                            playerStore.next() 
                        }
                    })

                    if (success) {
                        console.log('✅ Stream Bridge activo y reproduciendo automáticamente');
                        // Forzamos el estado de reproducción en el store
                        playerStore.play();
                        activateBlur(); 
                    } else {
                        // SOLO si el audio local TAMBIÉN falla, pasamos a la siguiente
                        console.error('❌ Error crítico: Ni YouTube ni Stream Bridge funcionaron.');
                        playerStore.next();
                    }
                    return success
                })
        }
    })
}

const handlePlayerStateChange = (state: number): void => {
    switch (state) {
        case window.YT.PlayerState.PLAYING:
            playerStore.play()
            lottieInstance?.play()
            if (currentTrack.value) {
                addToRecentlyPlayed({ ...currentTrack.value })
                
                // ACTUALIZAR AUTOR: Si el store dice "Cargando", intentar capturarlo del video
                const videoData = (ytPlayer.value as any)?.getVideoData?.()
                if (videoData?.author && (!currentTrack.value.video_author || currentTrack.value.video_author.includes('Cargando'))) {
                    playerStore.updateCurrentTrackAuthor(videoData.author)
                }
            }
            
            // LÓGICA DE VELO: Solo si estamos lejos del final, iniciamos el conteo para quitarlo (5s)
            const timeLeft = (ytPlayer.value?.getDuration() || 0) - (ytPlayer.value?.getCurrentTime() || 0)
            if (timeLeft > (ENDING_BLUR_OFFSET / 1000) + 1) {
                scheduleBlurRemoval() 
            } else {
                activateBlur()
            }
            break
        case window.YT.PlayerState.PAUSED:
            playerStore.pause()
            lottieInstance?.pause()
            activateBlur() // Siempre blur al pausar
            break
        case window.YT.PlayerState.BUFFERING:
            activateBlur() // Siempre blur al cargar/buffer
            break
        case window.YT.PlayerState.ENDED:
            if (playerStore.playlist.length - (playerStore.currentIndex + 1) < 3) {
                expandPlaylistWithMoreSongs()
            }
            playerStore.next()
            break
    }
}

/* ==================== CONTROLES ==================== */
const next = (): void => { stopAllPlayback(); playerStore.next() }
const prev = (): void => { stopAllPlayback(); playerStore.prev() }
const toggleShuffle = (): void => playerStore.toggleShuffle()
const isRepeatActive = ref(false)
const toggleRepeat = (): void => { isRepeatActive.value = !isRepeatActive.value }
const togglePlayPause = (): void => {
    if (isLocalPlayback.value) {
        if (isPlaying.value) {
            pauseLocalAudio()
            playerStore.pause()
            activateBlur()
        } else {
            resumeLocalAudio()
            playerStore.play()
            scheduleBlurRemoval()
            showToast('Reproduciendo audio alternativo (Sin video)', false)
        }
    } else if (ytPlayer.value) {
        const state = ytPlayer.value.getPlayerState()
        state === window.YT.PlayerState.PLAYING ? ytPlayer.value.pauseVideo() : ytPlayer.value.playVideo()
    }
}

const isSeeking = ref(false)

const handleSeek = (): void => {
    if (isLocalPlayback.value) {
        if (!isSeeking.value) return
        const total = getLocalAudioDuration()
        if (total > 0) setLocalAudioCurrentTime((progressValue.value / 100) * total)
    } else if (ytPlayer.value && isSeeking.value) {
        const total = ytPlayer.value.getDuration()
        if (total > 0) ytPlayer.value.seekTo((progressValue.value / 100) * total, true)
    }
}

const handleSeekStart = (): void => { isSeeking.value = true; activateBlur() }
const handleSeekEnd = (): void => {
    isSeeking.value = false
    handleSeek()
    setTimeout(() => {
        if (!isSeeking.value && isPlaying.value) {
            if (duration.value - currentTime.value > ENDING_BLUR_OFFSET / 1000) {
                scheduleBlurRemoval()
            }
        }
    }, 500)
}

const stopAllPlayback = () => {
    // 1. Activar velo inmediatamente para la transición
    activateBlur()
    
    // 2. Destruir motor de YouTube de forma absoluta
    if (ytPlayer.value) {
        try { 
            ytPlayer.value.stopVideo() // Parar antes de destruir
            ytPlayer.value.destroy()
        } catch (e) { }
        ytPlayer.value = null 
    }
    
    // 3. Destruir motor de Audio Local/Stream de forma absoluta
    destroyLocalAudio()
    isLocalPlayback.value = false
    
    // 4. Limpiar contenedor DOM de rastro de Iframes anteriores para evitar "fantasmas"
    if (playerContainer.value) {
        while (playerContainer.value.firstChild) {
            playerContainer.value.removeChild(playerContainer.value.firstChild)
        }
    }
    
    playerStore.pause()
    
    // 5. Limpiar timers de blur y estados de error
    clearBlurTimers()
    resetErrorState() 
}

/* ==================== LIFECYCLE & LOOP ==================== */
let animationFrameId: number | null = null
let lottieInstance: any = null

const startProgressLoop = (): void => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    const update = () => {
        const time = isLocalPlayback.value ? getLocalAudioCurrentTime() : ytPlayer.value?.getCurrentTime() || 0
        const total = isLocalPlayback.value ? getLocalAudioDuration() : ytPlayer.value?.getDuration() || 0
        
        if (time && total) {
            currentTime.value = time; duration.value = total
            progressValue.value = (time / total) * 100

            // VERIFICACIÓN CONSTANTE DEL VELO (Fase Final: 20 segundos antes)
            const timeLeft = total - time
            if (timeLeft <= (ENDING_BLUR_OFFSET / 1000) && timeLeft > 0 && !isVeilBlurActive.value) {
                console.log('🎬 Iniciando velo de cierre (20s restantes)')
                activateBlur()
            }
        }
        animationFrameId = requestAnimationFrame(update)
    }
    animationFrameId = requestAnimationFrame(update)
}

const setupLottie = (): void => {
    if (lottieInstance) lottieInstance.destroy()
    if (lottieContainer.value && !playerStore.isFullScreen) {
        lottieInstance = lottie.loadAnimation({
            container: lottieContainer.value, renderer: 'svg', loop: true,
            autoplay: isPlaying.value, animationData: animationStore.currentAnimation.data
        })
    }
}

/* ==================== WATCHERS ==================== */
watch(() => currentTrack.value, async (newTrack) => {
    if (!newTrack || isChangingTrack.value) return
    isChangingTrack.value = true
    try {
        stopAllPlayback()
        activateBlur()
        if (newTrack.isLocal && newTrack.localPath) {
            await playLocalTrackFromStore(newTrack, (t, d) => {
                currentTime.value = t; duration.value = d; progressValue.value = (t / d) * 100
            }, () => playerStore.next())
        } else {
            await loadYouTubeAPI()
            await nextTick()
            createPlayer(newTrack.video_id)
        }
        if (showLyrics.value) loadLyrics(newTrack)
    } finally {
        setTimeout(() => { isChangingTrack.value = false }, 200)
    }
}, { immediate: true })

watch(() => playerStore.isFullScreen, async (isFull) => {
    if (isFull) {
        lastMiniPosition.value = { ...position.value }
        activateBlur()
        await nextTick()
        forceIframeResize()
    } else {
        if (isExpanded.value) { await nextTick(); setupLottie() }
    }
})

onMounted(() => {
    window.addEventListener('resize', forceIframeResize)
    if (!playerStore.isFullScreen && isExpanded.value) setupLottie()
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', forceIframeResize)
    stopAllPlayback()
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>
<style scoped>
@import url('@/assets/css/player-styles.css');
</style>
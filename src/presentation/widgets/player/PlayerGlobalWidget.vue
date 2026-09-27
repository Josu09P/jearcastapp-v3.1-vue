<template>
    <div v-if="currentTrack" class="jearcast-global-player">
        <!-- MODO 1: PANTALLA COMPLETA (FULLSCREEN) -->
        <Transition name="slide-up">
            <div v-show="playerStore.playerMode === 'fullscreen'" class="unified-player fullscreen-mode">
                <!-- Background Blur -->
                <div class="background-blur"
                    :style="{ backgroundImage: `url(${currentTrack?.video_thumbnail})` }">
                </div>

                <!-- Contenedor principal -->
                <div class="player-content fullscreen">
                    <!-- HEADER - Fullscreen -->
                    <div class="header-fullscreen d-flex align-items-center gap-2 gap-md-3">
                        <!-- Botón Minimizar a barra inferior -->
                        <button @click="closeFullScreen" class="btn-close-fs flex-shrink-0" title="Minimizar a barra inferior">
                            <i class="bi bi-chevron-down"></i>
                        </button>

                        <!-- Botón Modo Flotante / Miniplayer -->
                        <button @click="playerStore.enterMiniplayer()" class="btn-close-fs flex-shrink-0" title="Modo flotante (Miniplayer)">
                            <i class="bi bi-pip"></i>
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

                    <!-- SECCIÓN DE VIDEO/ANIMACIÓN (Permanente en el DOM para evitar que el audio se corte) -->
                    <div class="video-section fullscreen" :class="{ 'with-lyrics': showLyrics }">
                        <div class="video-wrapper" :class="{
                            'fullscreen': playerStore.playerMode === 'fullscreen',
                            'mini-hidden': playerStore.playerMode !== 'fullscreen',
                            'is-local-playback': isLocalPlayback
                        }">
                            <div v-if="!isLocalPlayback" ref="playerHost" class="iframe-host">
                                <div ref="playerContainer" id="yt-player-target" class="iframe-element"></div>
                            </div>
                            <div v-if="isLocalPlayback" class="local-player-view">
                                <div v-if="animationStore.replaceCoverWithAnimation" ref="localLottieContainer" class="local-lottie-fullscreen"></div>
                                <div v-else class="local-player-placeholder">
                                    <div class="local-fullscreen-cover-wrap mb-3">
                                        <img v-if="currentTrack?.video_thumbnail" :src="currentTrack.video_thumbnail" class="local-fullscreen-cover" />
                                        <div v-else class="local-fullscreen-disc">
                                            <i class="bi bi-disc-fill"></i>
                                        </div>
                                    </div>
                                    <p class="fs-5 fw-bold mb-1 text-white text-truncate text-center" style="max-width: 85%;">{{ currentTrack?.video_title }}</p>
                                    <small class="text-white-50">{{ currentTrack?.video_author || 'Música Local' }}</small>
                                </div>
                            </div>
                            <div v-if="!isLocalPlayback" class="video-veil" :class="{ 'blur-active': isVeilBlurActive }"></div>
                        </div>
                    </div>

                    <!-- INFO DEL AUTOR -->
                    <div class="author-info-section fullscreen">
                        <div class="author-info-content d-flex align-items-center gap-2">
                            <i class="bi bi-person-circle author-icon" style="color: white !important;"></i>
                            <span class="author-name">{{ currentTrack.video_author || 'Cargando artista...' }}</span>
                            <span v-if="currentTrack.video_author" class="author-badge">Artista</span>
                            <span v-else class="author-badge bg-secondary bg-opacity-25">Cargando</span>
                        </div>
                    </div>

                    <!-- CONTROLES FULLSCREEN -->
                    <div class="controls-wrapper fullscreen">
                        <div class="progress-container fullscreen">
                            <input type="range" min="0" max="100" step="0.1" v-model="progressValue" @input="handleSeek"
                                @mousedown="handleSeekStart" @mouseup="handleSeekEnd" class="form-range custom-range" />
                            <div class="d-flex justify-content-between mt-2 text-secondary font-monospace">
                                <span>{{ currentTimeFormatted }}</span>
                                <span>{{ durationFormatted }}</span>
                            </div>
                        </div>

                        <div class="controls-row">
                            <div class="buttons-container fullscreen">
                                <button @click="toggleShuffle" class="control-btn secondary"
                                    :class="{ 'active': playerStore.isShuffling }" title="Aleatorio">
                                    <i class="bi bi-shuffle"></i>
                                </button>

                                <button @click="toggleRepeat" class="control-btn secondary"
                                    :class="{ 'active': isRepeatActive }" title="Repetir">
                                    <i class="bi bi-repeat"></i>
                                </button>

                                <button @click="prev" class="control-btn main" title="Anterior">
                                    <i class="bi bi-skip-start-fill"></i>
                                </button>
                                <button @click="togglePlayPause" class="control-btn play" :title="isPlaying ? 'Pausa' : 'Reproducir'">
                                    <i :class="isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill'"></i>
                                </button>
                                <button @click="next" class="control-btn main" title="Siguiente">
                                    <i class="bi bi-skip-end-fill"></i>
                                </button>

                                <AudioControl @volume-change="handleVolumeChange"
                                    @eq-change="handleEqChange" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- COMPONENTE DE LETRAS DENTRO DEL REPRODUCTOR -->
                <LyricsDisplay :lyrics="currentLyrics" :loading="loadingLyrics" :visible="showLyrics"
                    :current-time="currentTime" @close="closeLyrics" @seek="onLyricsSeek" />
            </div>
        </Transition>

        <!-- MODO 2: BARRA INFERIOR FIJA TIPO SPOTIFY / SPOTUBE -->
        <BottomPlayerBar
            v-if="playerStore.playerMode === 'bottom-bar'"
            :current-track="currentTrack"
            :is-playing="isPlaying"
            :is-shuffling="playerStore.isShuffling"
            :is-repeat-active="isRepeatActive"
            :progress-value="progressValue"
            :current-time-formatted="currentTimeFormatted"
            :duration-formatted="durationFormatted"
            :show-lyrics="showLyrics"
            :is-favorite="isCurrentFavorite"
            @toggle-play="togglePlayPause"
            @prev="prev"
            @next="next"
            @toggle-shuffle="toggleShuffle"
            @toggle-repeat="toggleRepeat"
            @seek="onBottomBarSeek"
            @seek-start="handleSeekStart"
            @seek-end="handleSeekEnd"
            @open-fullscreen="playerStore.openFullScreen()"
            @open-miniplayer="playerStore.enterMiniplayer()"
            @toggle-lyrics="toggleLyrics(currentTrack)"
            @volume-change="handleVolumeChange"
            @toggle-favorite="toggleFavorite"
        />

        <!-- MODO 3: MINIPLAYER FLOTANTE DESACOPLADO (PIP NATIVO ALWAYS-ON-TOP) -->
        <div v-if="playerStore.playerMode === 'miniplayer'" class="floating-pip-window">
            <!-- Ambient Blur Background (Liquid Glass reflection) -->
            <div
                v-if="currentTrack?.video_thumbnail"
                class="pip-ambient-glow"
                :style="{ backgroundImage: `url(${currentTrack.video_thumbnail})` }"
            ></div>

            <div class="pip-drag-bar d-flex align-items-center justify-content-between px-2 py-1">
                <div class="d-flex align-items-center gap-2 overflow-hidden pip-drag-content">
                    <i class="bi bi-music-note-beamed text-white-50" style="font-size: 12px;"></i>
                    <span class="pip-title text-truncate">{{ currentTrack?.video_title }}</span>
                </div>
                <div class="d-flex align-items-center gap-1 pip-window-actions">
                    <button @click="playerStore.leaveMiniplayer()" class="btn-pip-act" title="Restaurar ventana completa">
                        <i class="bi bi-arrows-angle-expand"></i>
                    </button>
                    <button @click="minimizeWindow" class="btn-pip-act" title="Minimizar">
                        <i class="bi bi-dash"></i>
                    </button>
                    <button @click="closeWindow" class="btn-pip-act btn-pip-close" title="Cerrar">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>

            <div class="pip-body d-flex align-items-center gap-3 px-3 py-2">
                <div class="pip-thumb-wrapper" @click="playerStore.leaveMiniplayer()" title="Clic para restaurar">
                    <div v-if="animationStore.replaceCoverWithAnimation" ref="pipLottieContainer" class="pip-lottie-thumb"></div>
                    <img v-else :src="currentTrack?.video_thumbnail" class="pip-thumb" />
                    <div class="pip-thumb-hover">
                        <i class="bi bi-arrows-angle-expand"></i>
                    </div>
                </div>

                <div class="pip-info flex-grow-1 overflow-hidden">
                    <span class="pip-track-name text-truncate d-block fw-semibold">{{ currentTrack?.video_title }}</span>
                    <span class="pip-track-artist text-truncate d-block">{{ currentTrack?.video_author || 'Artista' }}</span>

                    <div class="pip-progress-row d-flex align-items-center gap-2 mt-2">
                        <span class="pip-time">{{ currentTimeFormatted }}</span>
                        <input type="range" min="0" max="100" step="0.1" v-model="progressValue" @input="handleSeek"
                            @mousedown="handleSeekStart" @mouseup="handleSeekEnd" class="pip-range" />
                        <span class="pip-time">{{ durationFormatted }}</span>
                    </div>
                </div>

                <div class="pip-controls d-flex align-items-center gap-2">
                    <button @click="prev" class="btn-pip-ctrl" title="Anterior">
                        <i class="bi bi-skip-start-fill"></i>
                    </button>
                    <button @click="togglePlayPause" class="btn-pip-play" :title="isPlaying ? 'Pausa' : 'Reproducir'">
                        <i :class="isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill'"></i>
                    </button>
                    <button @click="next" class="btn-pip-ctrl" title="Siguiente">
                        <i class="bi bi-skip-end-fill"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
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
    setLocalAudioVolume,
    setLocalAudioEq,
    destroyLocalAudio
} from '@/data/services/audio/LocalAudioService'
import { useYouTubePlayer } from '@/composables/useYouTubePlayer'
import { useLocalAudioPlayer } from '@/composables/useLocalAudioPlayer'
import { usePlayerUI } from '@/composables/usePlayerUI'
import { useDiscovery } from '@/composables/useDiscovery'
import BottomPlayerBar from './BottomPlayerBar.vue'
import LyricsDisplay from '../LyricsDisplay.vue'
import AudioControl from './AudioControl.vue'
import { addFavoriteMusic } from '@/domain/usecases/favorites/AddFavoriteMusic'
import { removeFavoriteMusic } from '@/domain/usecases/favorites/RemoveFavoriteMusic'
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
const playerHost = ref<HTMLDivElement | null>(null)
const playerContainer = ref<HTMLDivElement | null>(null)
const lottieContainer = ref<HTMLElement | null>(null)
const pipLottieContainer = ref<HTMLElement | null>(null)
let pipLottieInstance: any = null
const localLottieContainer = ref<HTMLElement | null>(null)
let localLottieInstance: any = null
const lastMiniPosition = ref<{ x: number; y: number } | null>(null)
let loadSequence = 0
let changeTrackDebounceTimer: any = null

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

const isCurrentFavorite = computed(() => {
    if (!currentTrack.value) return false
    return userDataStore.favorites.some(f => f.video_id === currentTrack.value?.video_id)
})

const toggleFavorite = async () => {
    if (!currentTrack.value || !userStore.id) return
    const track = currentTrack.value
    try {
        if (isCurrentFavorite.value) {
            await removeFavoriteMusic({ user_id: userStore.id, video_id: track.video_id })
            await userDataStore.fetchFavorites(true)
            showToast('Eliminado de favoritos')
        } else {
            await addFavoriteMusic({
                user_id: userStore.id,
                video_id: track.video_id,
                video_title: track.video_title,
                video_thumbnail: track.video_thumbnail,
            })
            await userDataStore.fetchFavorites(true)
            showToast('Agregado a favoritos')
        }
    } catch (e) {
        console.error('Error toggling favorite:', e)
    }
}

const onBottomBarSeek = (val: number) => {
    progressValue.value = val
    handleSeek(true)
}

const minimizeWindow = () => {
    if (window.electron?.minimize) window.electron.minimize()
}

const closeWindow = () => {
    if (window.electron?.close) window.electron.close()
}

const closeFullScreen = (): void => {
    playerStore.closeFullScreen()
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
    playerStore.setVolume(value)
    if (ytPlayer.value) ytPlayer.value.setVolume(value)
    setLocalAudioVolume(value)
}

const handleEqChange = (values: any) => {
    setLocalAudioEq(values)
    if (window.electron?.ipcRenderer?.send) {
        window.electron.ipcRenderer.send('audio-eq-changed', values)
    }
}

const createPlayer = (videoId: string, sequence: number = loadSequence): void => {
    // RESET DE ESTADO DE ERROR
    resetErrorState()

    // 1. REUTILIZACIÓN DE IFRAME EXISTENTE (Evita reconstrucción DOM, fugas y colisión de múltiples iframes)
    if (ytPlayer.value && typeof ytPlayer.value.loadVideoById === 'function') {
        const iframe = ytPlayer.value.getIframe?.()
        if (iframe && document.body.contains(iframe)) {
            try {
                ytPlayer.value.loadVideoById({ videoId, startSeconds: 0 })
                ytPlayer.value.unMute()
                ytPlayer.value.setVolume(playerStore.volume)
                if (ytPlayer.value.setPlaybackQuality) {
                    ytPlayer.value.setPlaybackQuality('hd1080')
                }
                ytPlayer.value.playVideo()
                if (window.electron?.ipcRenderer?.send) {
                    window.electron.ipcRenderer.send('boost-youtube-audio')
                }
                startProgressLoop()
                activateBlur()
                scheduleBlurRemoval()
                forceIframeResize()
                return
            } catch (e) {
                console.warn('Reutilización de iframe falló, regenerando desde cero...', e)
            }
        }
    }

    // 2. CREACIÓN LIMPIA: Garantizar que playerHost o video-wrapper contenga únicamente UN iframe
    const hostEl = playerHost.value || playerContainer.value?.parentElement
    if (hostEl) {
        // Purgar cualquier iframe residual para evitar iframes duplicados side-by-side
        const iframes = hostEl.querySelectorAll('iframe')
        iframes.forEach((ifr: HTMLElement) => ifr.remove())
    }

    if (ytPlayer.value) {
        try { 
            ytPlayer.value.destroy() 
        } catch (e) { 
            console.warn('Error al destruir player:', e)
        }
        ytPlayer.value = null
    }

    // Crear un contenedor objetivo único dentro de playerHost
    if (playerHost.value) {
        playerHost.value.innerHTML = '<div id="yt-player-target" class="iframe-element"></div>'
        const target = playerHost.value.querySelector('#yt-player-target')
        if (!target) return
        playerContainer.value = target as HTMLDivElement
    } else if (playerContainer.value) {
        while (playerContainer.value.firstChild) {
            playerContainer.value.removeChild(playerContainer.value.firstChild)
        }
    }

    const mountTarget = playerContainer.value || 'yt-player-target'

    ytPlayer.value = new window.YT.Player(mountTarget, {
        videoId,
        playerVars: {
            autoplay: 1, controls: 0, modestbranding: 1, rel: 0,
            enablejsapi: 1, origin: window.location.origin, disablekb: 1,
            fs: 0, iv_load_policy: 3, cc_load_policy: 0, quality: 'hd1080'
        },
        events: {
            onReady: (e: any) => {
                if (sequence !== loadSequence) {
                    try { e.target.stopVideo() } catch(err) {}
                    return
                }
                e.target.unMute()
                e.target.setVolume(playerStore.volume)
                if (e.target.setPlaybackQuality) {
                    e.target.setPlaybackQuality('hd1080')
                }
                e.target.playVideo()
                if (window.electron?.ipcRenderer?.send) {
                    window.electron.ipcRenderer.send('boost-youtube-audio')
                }
                const videoData = e.target.getVideoData()
                if (videoData?.author) playerStore.updateCurrentTrackAuthor(videoData.author)
                startProgressLoop()
                activateBlur()
                scheduleBlurRemoval()
                forceIframeResize()
            },
            onStateChange: (e: any) => {
                handlePlayerStateChange(e.data)
            },
            onError: (e: any) => {
                const activeId = playerStore.currentTrack?.video_id || videoId
                handleYouTubeError(e.data, activeId,
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
                            playerStore.play();
                            scheduleBlurRemoval();
                            showToast('Reproduciendo audio alternativo - Sin video por políticas de YouTube');
                        }
                        return success
                    }
                )
            }
        }
    })
}

const handlePlayerStateChange = async (state: number): Promise<void> => {
    switch (state) {
        case 1:
        case window.YT?.PlayerState?.PLAYING:
            playerStore.play()
            if (window.electron?.ipcRenderer?.send) {
                window.electron.ipcRenderer.send('boost-youtube-audio')
            }
            lottieInstance?.play()
            if (pipLottieInstance) pipLottieInstance.play()
            if (localLottieInstance) localLottieInstance.play()
            if (currentTrack.value) {
                addToRecentlyPlayed({ ...currentTrack.value })
                
                // ACTUALIZAR AUTOR: Si el store dice "Cargando", intentar capturarlo del video
                const videoData = (ytPlayer.value as any)?.getVideoData?.()
                if (videoData?.author && (!currentTrack.value.video_author || currentTrack.value.video_author.includes('Cargando'))) {
                    playerStore.updateCurrentTrackAuthor(videoData.author)
                }
            }
            
            // LÓGICA DE VELO: Quitar el velo de inicio tras 5s, o mantenerlo si estamos en los 20s finales
            const totalDur = ytPlayer.value?.getDuration?.() || 0
            const curTime = ytPlayer.value?.getCurrentTime?.() || 0
            if (totalDur > 30 && (totalDur - curTime) <= (ENDING_BLUR_OFFSET / 1000) && curTime > 0) {
                activateBlur() 
            } else {
                scheduleBlurRemoval()
            }
            break
        case 2:
        case window.YT?.PlayerState?.PAUSED:
            playerStore.pause()
            lottieInstance?.pause()
            if (pipLottieInstance) pipLottieInstance.pause()
            if (localLottieInstance) localLottieInstance.pause()
            activateBlur() // Siempre blur al pausar
            break
        case 3:
        case window.YT?.PlayerState?.BUFFERING:
            activateBlur() // Siempre blur al cargar/buffer
            break
        case 0:
        case window.YT?.PlayerState?.ENDED:
            console.log('🎵 Canción terminada (State ENDED), pasando a la siguiente...')
            if (isRepeatActive.value) {
                if (ytPlayer.value?.seekTo) {
                    ytPlayer.value.seekTo(0, true)
                    ytPlayer.value.playVideo?.()
                }
                return
            }
            if (playerStore.playlist.length - (playerStore.currentIndex + 1) < 3) {
                try {
                    await expandPlaylistWithMoreSongs()
                } catch (e) {}
            }
            playerStore.next()
            break
    }
}

/* ==================== CONTROLES ==================== */
const next = (): void => { playerStore.next() }
const prev = (): void => { playerStore.prev() }
const toggleShuffle = (): void => playerStore.toggleShuffle()
const isRepeatActive = ref(false)
const toggleRepeat = (): void => { isRepeatActive.value = !isRepeatActive.value }
const togglePlayPause = (): void => {
    if (isLocalPlayback.value) {
        if (playerStore.isPlaying) {
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
        if (playerStore.isPlaying) {
            playerStore.pause()
            try { ytPlayer.value.pauseVideo() } catch (e) {}
            activateBlur()
        } else {
            playerStore.play()
            try { ytPlayer.value.playVideo() } catch (e) {}
            scheduleBlurRemoval()
        }
    } else {
        if (playerStore.isPlaying) {
            playerStore.pause()
        } else {
            playerStore.play()
        }
    }
}

const isSeeking = ref(false)

const handleSeek = (force: boolean = false): void => {
    if (!isSeeking.value && !force) return
    if (isLocalPlayback.value) {
        const total = getLocalAudioDuration()
        if (total > 0) setLocalAudioCurrentTime((progressValue.value / 100) * total)
    } else if (ytPlayer.value) {
        const total = ytPlayer.value.getDuration()
        if (total > 0) ytPlayer.value.seekTo((progressValue.value / 100) * total, true)
    }
}

const onLyricsSeek = (targetTime: number): void => {
    if (isLocalPlayback.value) {
        setLocalAudioCurrentTime(targetTime)
    } else if (ytPlayer.value) {
        ytPlayer.value.seekTo(targetTime, true)
    }
}

const handleSeekStart = (): void => { isSeeking.value = true; activateBlur() }
const handleSeekEnd = (): void => {
    handleSeek(true)
    isSeeking.value = false
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

/* ==================== EVENTOS DE TECLADO & MEDIA ==================== */
const handleGlobalKeyDown = (e: KeyboardEvent) => {
    // No actuar si el usuario está escribiendo en un input, textarea o contenido editable
    const activeElement = document.activeElement;
    const isInput = activeElement?.tagName === 'INPUT' || 
                   activeElement?.tagName === 'TEXTAREA' || 
                   (activeElement as HTMLElement)?.isContentEditable;
    
    if (isInput) return;

    if (e.code === 'Space' || e.key === ' ' || e.code === 'Enter' || e.key === 'Enter') {
        e.preventDefault();
        togglePlayPause();
    }
}

const setupMediaKeys = () => {
    if (window.electron?.onMediaKey) {
        window.electron.onMediaKey((key: string) => {
            console.log(`🎵 [MediaKey] ${key}`);
            switch (key) {
                case 'playpause': togglePlayPause(); break;
                case 'next': next(); break;
                case 'prev': prev(); break;
            }
        });
    }
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

            // Auto-advance si YouTube llega al final (>99.5% o total - time < 0.4s) y no disparó ENDED
            if (total > 5 && (total - time) <= 0.4 && playerStore.isPlaying && !isSeeking.value) {
                console.log('⏰ Fin de pista detectado por tiempo, avanzando a la siguiente...')
                if (isRepeatActive.value) {
                    if (ytPlayer.value?.seekTo) {
                        ytPlayer.value.seekTo(0, true)
                        ytPlayer.value.playVideo?.()
                    }
                } else {
                    if (playerStore.playlist.length - (playerStore.currentIndex + 1) < 3) {
                        expandPlaylistWithMoreSongs()
                    }
                    playerStore.next()
                }
                return
            }

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

const setupPipLottie = (): void => {
    if (pipLottieInstance) {
        try { pipLottieInstance.destroy() } catch (e) {}
        pipLottieInstance = null
    }
    if (pipLottieContainer.value && animationStore.replaceCoverWithAnimation && playerStore.playerMode === 'miniplayer') {
        try {
            pipLottieInstance = lottie.loadAnimation({
                container: pipLottieContainer.value,
                renderer: 'svg',
                loop: true,
                autoplay: isPlaying.value,
                animationData: animationStore.currentAnimation.data
            })
        } catch (e) {
            console.error('Error cargando animación Lottie en PIP:', e)
        }
    }
}

const setupLocalLottie = (): void => {
    if (localLottieInstance) {
        try { localLottieInstance.destroy() } catch (e) {}
        localLottieInstance = null
    }
    if (localLottieContainer.value && animationStore.replaceCoverWithAnimation && isLocalPlayback.value) {
        try {
            localLottieInstance = lottie.loadAnimation({
                container: localLottieContainer.value,
                renderer: 'svg',
                loop: true,
                autoplay: isPlaying.value,
                animationData: animationStore.currentAnimation.data
            })
        } catch (e) {
            console.error('Error cargando animación Lottie en Local Fullscreen:', e)
        }
    }
}

/* ==================== WATCHERS ==================== */
watch(() => currentTrack.value, (newTrack) => {
    if (!newTrack) {
        currentLyrics.value = null
        stopAllPlayback()
        return
    }

    const currentSequence = ++loadSequence
    currentLyrics.value = null

    if (changeTrackDebounceTimer) {
        clearTimeout(changeTrackDebounceTimer)
    }

    // Debounce de 120ms para soportar saltos rápidos continuos (Next / Prev / Clics repetidos)
    changeTrackDebounceTimer = setTimeout(async () => {
        if (currentSequence !== loadSequence) return

        try {
            if (newTrack.isLocal && newTrack.localPath) {
                clearBlurTimers()
                isVeilBlurActive.value = false
                if (ytPlayer.value) {
                    try {
                        ytPlayer.value.stopVideo?.()
                        ytPlayer.value.destroy?.()
                    } catch (e) {}
                    ytPlayer.value = null
                }
                if (playerHost.value) {
                    playerHost.value.innerHTML = ''
                }
                isLocalPlayback.value = true
                await playLocalTrackFromStore(newTrack, (t, d) => {
                    if (currentSequence !== loadSequence) return
                    currentTime.value = t; duration.value = d; progressValue.value = (t / d) * 100
                }, () => {
                    if (currentSequence === loadSequence) playerStore.next()
                })
                if (animationStore.replaceCoverWithAnimation) {
                    await nextTick()
                    setupLocalLottie()
                }
            } else {
                destroyLocalAudio()
                isLocalPlayback.value = false
                currentTime.value = 0
                duration.value = 0
                progressValue.value = 0
                clearBlurTimers()
                activateBlur()
                if (localLottieInstance) {
                    try { localLottieInstance.destroy() } catch (e) {}
                    localLottieInstance = null
                }
                await loadYouTubeAPI()
                if (currentSequence !== loadSequence) return
                await nextTick()
                createPlayer(newTrack.video_id, currentSequence)
            }

            if (currentSequence !== loadSequence) return

            if (showLyrics.value) loadLyrics(newTrack)

            // Cargar animación PIP si está en miniplayer
            if (playerStore.playerMode === 'miniplayer' && animationStore.replaceCoverWithAnimation) {
                await nextTick()
                setupPipLottie()
            }

            // EXPANSIÓN PROACTIVA: Si quedan pocas canciones, cargar más para reproducción ininterrumpida
            const remaining = playerStore.playlist.length - (playerStore.currentIndex + 1)
            if (remaining < 10) {
                expandPlaylistWithMoreSongs()
            }
        } catch (err) {
            console.error('Error changing track:', err)
        }
    }, 120)
}, { immediate: true })

// Sincronizar estado play/pause con la animación Lottie del miniplayer PIP y fullscreen local
watch(isPlaying, (playing) => {
    if (pipLottieInstance) {
        if (playing) pipLottieInstance.play()
        else pipLottieInstance.pause()
    }
    if (localLottieInstance) {
        if (playing) localLottieInstance.play()
        else localLottieInstance.pause()
    }
})

// Control de modo miniplayer / fullscreen local y cambio de configuración de animación
watch(() => [playerStore.playerMode, animationStore.replaceCoverWithAnimation, animationStore.currentAnimationId, isLocalPlayback.value], async () => {
    if (playerStore.playerMode === 'miniplayer' && animationStore.replaceCoverWithAnimation) {
        await nextTick()
        setupPipLottie()
    } else if (pipLottieInstance) {
        try { pipLottieInstance.destroy() } catch (e) {}
        pipLottieInstance = null
    }

    if (playerStore.playerMode === 'fullscreen' && isLocalPlayback.value && animationStore.replaceCoverWithAnimation) {
        await nextTick()
        setupLocalLottie()
    } else if (localLottieInstance && (!animationStore.replaceCoverWithAnimation || !isLocalPlayback.value || playerStore.playerMode !== 'fullscreen')) {
        try { localLottieInstance.destroy() } catch (e) {}
        localLottieInstance = null
    }
})

// Watcher para el modo aleatorio: Si se activa y hay más canciones en el origen, cargar más
watch(() => playerStore.isShuffling, (shuffling) => {
    if (shuffling && playerStore.hasMoreInContext) {
        console.log('🎲 [Shuffle] Cargando más canciones para aumentar la variedad...')
        expandPlaylistWithMoreSongs()
    }
})

watch(() => playerStore.isFullScreen, async (isFull) => {
    if (isFull) {
        lastMiniPosition.value = { ...position.value }
        await nextTick()
        forceIframeResize()
        if (isLocalPlayback.value && animationStore.replaceCoverWithAnimation) {
            setupLocalLottie()
        }
    } else {
        if (isExpanded.value) { await nextTick(); setupLottie() }
    }
})

// REPARACIÓN: Re-inicializar Lottie cuando se expande el mini-player
watch(() => isExpanded.value, async (expanded) => {
    if (expanded && !playerStore.isFullScreen) {
        await nextTick()
        setupLottie()
    }
})

// REPARACIÓN: Actualizar animación cuando se cambia en ajustes
watch(() => animationStore.currentAnimationId, () => {
    if (!playerStore.isFullScreen && isExpanded.value) {
        setupLottie()
    }
    if (playerStore.isFullScreen && isLocalPlayback.value && animationStore.replaceCoverWithAnimation) {
        nextTick().then(() => setupLocalLottie())
    }
})

onMounted(() => {
    window.addEventListener('resize', forceIframeResize)
    window.addEventListener('keydown', handleGlobalKeyDown)
    window.addEventListener('reload-animation', async () => {
        if (playerStore.playerMode === 'miniplayer') {
            await nextTick()
            setupPipLottie()
        }
        if (playerStore.playerMode === 'fullscreen' && isLocalPlayback.value) {
            await nextTick()
            setupLocalLottie()
        }
    })
    setupMediaKeys()
    if (!playerStore.isFullScreen && isExpanded.value) setupLottie()
    if (playerStore.playerMode === 'miniplayer' && animationStore.replaceCoverWithAnimation) {
        nextTick().then(() => setupPipLottie())
    }
    if (playerStore.playerMode === 'fullscreen' && isLocalPlayback.value && animationStore.replaceCoverWithAnimation) {
        nextTick().then(() => setupLocalLottie())
    }
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', forceIframeResize)
    window.removeEventListener('keydown', handleGlobalKeyDown)
    
    if (pipLottieInstance) {
        try { pipLottieInstance.destroy() } catch (e) {}
        pipLottieInstance = null
    }

    if (localLottieInstance) {
        try { localLottieInstance.destroy() } catch (e) {}
        localLottieInstance = null
    }
    
    if (window.electron?.removeMediaKeyListener) {
        window.electron.removeMediaKeyListener()
    }
    
    if (changeTrackDebounceTimer) {
        clearTimeout(changeTrackDebounceTimer)
    }
    stopAllPlayback()
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>
<style scoped>
@import url('@/assets/css/player-styles.css');

.iframe-host {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.iframe-host :deep(iframe),
.iframe-host .iframe-element {
    width: 100% !important;
    height: 100% !important;
    border: none;
    display: block;
}

/* ==================== MODO 3: MINIPLAYER FLOTANTE DESACOPLADO ==================== */
.floating-pip-window {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(14, 14, 20, 0.85);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
    z-index: 99999;
    user-select: none;
    overflow: hidden;
    clip-path: inset(0 round 16px);
    -webkit-clip-path: inset(0 round 16px);
}

.pip-ambient-glow {
    position: absolute;
    inset: -20px;
    background-size: cover;
    background-position: center;
    filter: blur(48px) brightness(0.24) saturate(200%);
    opacity: 0.22;
    pointer-events: none;
    z-index: 0;
    transition: opacity 0.5s ease;
    border-radius: 16px;
}

.pip-drag-bar,
.pip-body {
    position: relative;
    z-index: 2;
}

.pip-drag-bar {
    height: 32px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.005) 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    -webkit-app-region: drag;
    cursor: grab;
}

.pip-drag-content {
    flex: 1;
    min-width: 0;
}

.pip-title {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.85);
    font-weight: 500;
}

.pip-window-actions {
    -webkit-app-region: no-drag;
}

.btn-pip-act {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    padding: 3px 6px;
    font-size: 11px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-pip-act:hover {
    color: white;
    background: rgba(255, 255, 255, 0.15);
}

.btn-pip-close:hover {
    background: #e74c3c !important;
    color: white;
}

.pip-body {
    flex: 1;
    display: flex;
    align-items: center;
    -webkit-app-region: no-drag;
}

.pip-thumb-wrapper {
    position: relative;
    width: 64px;
    height: 64px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.pip-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.pip-lottie-thumb {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
}

.pip-lottie-thumb svg {
    width: 100% !important;
    height: 100% !important;
}

.pip-thumb-hover {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.2s;
    font-size: 16px;
}

.pip-thumb-wrapper:hover .pip-thumb-hover {
    opacity: 1;
}

.pip-info {
    min-width: 0;
}

.pip-track-name {
    color: white;
    font-size: 0.86rem;
    line-height: 1.25;
}

.pip-track-artist {
    color: rgba(255, 255, 255, 0.55);
    font-size: 0.74rem;
    line-height: 1.2;
}

.pip-progress-row {
    width: 100%;
}

.pip-time {
    font-size: 10px;
    font-family: monospace;
    color: rgba(255, 255, 255, 0.5);
}

.pip-range {
    -webkit-appearance: none;
    appearance: none;
    flex: 1;
    height: 3px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
}

.pip-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
}

.btn-pip-ctrl {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.15rem;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 3px;
}

.btn-pip-ctrl:hover {
    color: white;
    transform: scale(1.1);
}

.btn-pip-play {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: white;
    color: black;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.25);
    transition: all 0.2s ease;
}

.btn-pip-play:hover {
    transform: scale(1.08);
    background: #e6e6e6;
}

/* ==================== MODO LOCAL FULLSCREEN ==================== */
.local-player-view {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
}

.local-lottie-fullscreen {
    width: 100%;
    height: 100%;
    max-width: 320px;
    max-height: 320px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.local-player-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.local-fullscreen-cover-wrap {
    width: 200px;
    height: 200px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
}

.local-fullscreen-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.local-fullscreen-disc {
    font-size: 5rem;
    color: rgba(255, 255, 255, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
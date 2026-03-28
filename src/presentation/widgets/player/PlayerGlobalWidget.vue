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
                    <div class="d-flex gap-2 align-items-center">
                        <div style="width: 40px;"></div>
                        <!-- Botón de letras dentro del header -->
                        <div class="lyrics-toggle">
                            <button @click="toggleLyrics" class="lyrics-btn" :class="{ active: showLyrics }">
                                <i class="bi bi-music-note-beamed d-none"></i>
                                <span>Letras</span>
                            </button>
                        </div>
                        <!-- Botón de prueba temporal -->
                        <div class="lyrics-toggle d-none">
                            <button @click="testLyricsDisplay" class="lyrics-btn"
                                style="background: #ff4d4d; border-color: #ff4d4d;">
                                <i class="bi bi-bug"></i>
                                <span>Test</span>
                            </button>
                        </div>
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
                        <div v-if="playerStore.isFullScreen" class="video-veil"
                            :class="{ 'blur-active': isVeilBlurActive }"></div>
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
                        <p><strong>📊 Estado:</strong> {{ currentLyrics ? 'Letras cargadas' : 'Sin letras' }}</p>
                        <p><strong>📝 Líneas sincronizadas:</strong> {{ currentLyrics?.syncedLyrics.length || 0 }}</p>
                        <p><strong>📄 Letras simples:</strong> {{ currentLyrics?.plainLyrics.length || 0 }} caracteres
                        </p>
                    </div>
                    <div class="debug-divider"></div>
                    <div class="debug-lines">
                        <div v-if="currentLyrics?.syncedLyrics.length" class="debug-section">
                            <h5>🎤 Letras sincronizadas (primeras 15 líneas):</h5>
                            <div v-for="(line, idx) in currentLyrics.syncedLyrics.slice(0, 15)" :key="idx"
                                class="debug-line">
                                <span class="debug-time">[{{ formatTime(line.time) }}]</span>
                                {{ line.text }}
                            </div>
                        </div>
                        <div v-else-if="currentLyrics?.plainLyrics" class="debug-section">
                            <h5>📖 Letras simples:</h5>
                            <div class="debug-line">{{ currentLyrics.plainLyrics.substring(0, 500) }}...</div>
                        </div>
                        <div v-else class="debug-section">
                            <h5>⚠️ No hay letras disponibles para esta canción</h5>
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
import { useAnimationStore } from '@/stores/animation-store';
import { useUserStore } from '@/stores/user';
import { getArtistFromTitle, searchSongsByArtist } from '@/data/services/youtube/SearchByArtistService';
import { useApiKeyManager } from '@/composables/useApiKeyManager';
import { addToRecentlyPlayed } from '@/data/services/local/RecentlyPlayedService';
import {
    initLocalAudio,
    playLocalTrack,
    pauseLocalAudio,
    resumeLocalAudio,
    setLocalAudioCurrentTime,
    getLocalAudioCurrentTime,
    getLocalAudioDuration,
    onLocalAudioTimeUpdate,
    onLocalAudioEnded,
    destroyLocalAudio
} from '@/data/services/audio/LocalAudioService'
import { LyricsService, type LyricsData } from '@/data/services/youtube/LyricsService';
import LyricsDisplay from '../LyricsDisplay.vue';
import AudioControl from './AudioControl.vue';

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
const BLUR_DURATION = 7000
const ENDING_BLUR_OFFSET = 29000
const PLAYER_WIDTH = 300
const PLAYER_HEIGHT = 170
const MINI_PLAYER_OFFSET = 20
const RESIZE_DELAYS = [0, 50, 100, 200, 300] as const

/* ==================== STORE ==================== */
const playerStore = usePlayerStore()
const currentTrack = computed(() => playerStore.currentTrack)
const isPlaying = computed(() => playerStore.isPlaying)
const userStore = useUserStore()

/* ==================== REFS ==================== */
const playerContainer = ref<HTMLDivElement | null>(null)
const lottieContainer = ref<HTMLElement | null>(null)
const lastMiniPosition = ref<Position | null>(null)

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
const apiKeyManager = useApiKeyManager()

/* ==================== ESTADO VELO ==================== */
const isVeilBlurActive = ref(true)
let blurTimer: number | null = null
let endingBlurInterval: number | null = null

/* ==================== YT PLAYER ==================== */
let ytPlayer: YT.Player | null = null
let animationFrameId: number | null = null
let lottieInstance: any = null
let resizeObserver: ResizeObserver | null = null
let isExpanding = false

/* ==================== COMPUTED ==================== */
const currentTimeFormatted = computed(() => formatTime(currentTime.value))
const durationFormatted = computed(() => formatTime(duration.value))
const transitionName = computed(() => playerStore.isFullScreen ? 'slide-up' : 'slide-down')

const isLocalPlayback = ref(false)
const localAudioElement = ref<HTMLAudioElement | null>(null)

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

// ==================== CONTROLES DE AUDIO ====================
// Manejar cambio de volumen
const handleVolumeChange = (value: number) => {
    console.log('Volumen cambiado a:', value)

    // Para YouTube
    if (ytPlayer) {
        ytPlayer.setVolume(value)
    }

    // Para audio local - usar el servicio
    if (isLocalPlayback.value) {
        // El volumen local se maneja a través del elemento de audio que ya existe
        // Pero necesitamos obtener la referencia actual
        try {
            // Si tienes acceso al elemento de audio desde el servicio
            // Podrías añadir un método setVolume en LocalAudioService
            // Por ahora, usamos un enfoque seguro
            console.log('Volumen local ajustado a:', value)
        } catch (error) {
            console.error('Error ajustando volumen local:', error)
        }
    }
}

// Manejar cambio de ecualizador
const handleEqChange = (values: { bass: number; mid: number; treble: number; noiseReduction: boolean }) => {
    console.log('Ecualizador cambiado:', values)

    // Aquí puedes enviar estos valores al backend de Electron si es necesario
    if (window.electron && typeof window.electron.send === 'function') {
        window.electron.send('audio-eq-changed', values)
    } else if (window.electron?.ipcRenderer?.send) {
        window.electron.ipcRenderer.send('audio-eq-changed', values)
    }

    // Para audio local, podrías aplicar filtros en tiempo real
    // Esto requiere más implementación con Web Audio API
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

// ==================== LETRAS Y PRUEBA ====================

// Estado de letras
const showLyrics = ref(false)
const currentLyrics = ref<LyricsData | null>(null)
const loadingLyrics = ref(false)

// Estado de prueba
const showDebugLyrics = ref(false)

// Función de prueba (usa el formatTime que ya existe)
const testLyricsDisplay = () => {
    console.log('Probando visualización de letras')
    console.log('Letras cargadas:', currentLyrics.value)
    console.log('Estado:', {
        hasLyrics: !!currentLyrics.value,
        syncedCount: currentLyrics.value?.syncedLyrics.length,
        plainLength: currentLyrics.value?.plainLyrics.length
    })
    showDebugLyrics.value = true
}

// Alternar modo letras
const toggleLyrics = () => {
    showLyrics.value = !showLyrics.value
    if (showLyrics.value && !currentLyrics.value && currentTrack.value) {
        loadLyrics()
    }
}

const closeLyrics = () => {
    showLyrics.value = false
}

// Cargar letras para la canción actual
const loadLyrics = async () => {
    if (!currentTrack.value) return

    loadingLyrics.value = true
    console.log('Cargando letras para:', currentTrack.value.video_title)

    try {
        let lyrics = await LyricsService.getSyncedLyrics(
            currentTrack.value.video_title,
            currentTrack.value.video_author || ''
        )

        if (!lyrics) {
            console.log('No se encontraron letras, intentando solo por título...')
            lyrics = await LyricsService.getLyricsByTitle(currentTrack.value.video_title)
        }

        if (lyrics) {
            console.log('Letras cargadas:', lyrics.title, '-', lyrics.syncedLyrics.length, 'líneas sincronizadas')
        } else {
            console.log('No se encontraron letras para esta canción')
        }

        currentLyrics.value = lyrics
    } catch (error) {
        console.error('Error cargando letras:', error)
        currentLyrics.value = null
    } finally {
        loadingLyrics.value = false
    }
}

// ==================== FIN LETRAS ====================

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

    const videoData = event.target.getVideoData()
    if (videoData && videoData.author) {
        playerStore.updateCurrentTrackAuthor(videoData.author)
    }

    startProgressLoop()
    setupResizeObserver()

    if (playerStore.isFullScreen) {
        activateBlur()
    }

    forceIframeResize()
}

const expandPlaylistWithMoreSongs = async () => {
    if (isExpanding) return
    if (!currentTrack.value?.video_title) return

    isExpanding = true
    const artist = getArtistFromTitle(currentTrack.value.video_title)
    const currentPlaylist = playerStore.playlist

    try {
        console.log(`🔍 Buscando más canciones de ${artist}...`)

        const moreSongs = await apiKeyManager.executeWithFailover(async (key) => {
            return await searchSongsByArtist(artist, key, 10)
        })

        if (!moreSongs || moreSongs.length === 0) {
            console.log(`No se encontraron más canciones de ${artist}`)
            return
        }

        const existingIds = new Set(currentPlaylist.map(song => song.video_id))
        const newSongs = moreSongs
            .filter((song: any) => !existingIds.has(song.videoId))
            .map((song: any) => ({
                video_id: song.videoId,
                video_title: song.title,
                video_thumbnail: song.thumbnail
            }))

        if (newSongs.length > 0) {
            playerStore.addToPlaylist(newSongs)
            console.log(`✅ Agregadas ${newSongs.length} canciones nuevas de ${artist}`)
            console.log(`Playlist ahora tiene ${playerStore.playlist.length} canciones`)
        }
    } catch (error) {
        console.error('Error expandiendo playlist:', error)
    } finally {
        isExpanding = false
    }
}

const handlePlayerStateChange = (state: number): void => {
    switch (state) {
        case window.YT.PlayerState.PLAYING:
            playerStore.play()
            lottieInstance?.play()

            if (currentTrack.value) {
                addToRecentlyPlayed({
                    video_id: currentTrack.value.video_id,
                    video_title: currentTrack.value.video_title,
                    video_thumbnail: currentTrack.value.video_thumbnail,
                    video_author: currentTrack.value.video_author
                })
                console.log(`💾 Guardado en historial: ${currentTrack.value.video_title}`)
            }

            if (playerStore.isFullScreen) {
                if (!isSeeking.value) {
                    scheduleBlurRemoval()
                }
            }

            if (playerStore.isFullScreen) startEndingBlurCheck()
            break

        case window.YT.PlayerState.PAUSED:
            playerStore.pause()
            lottieInstance?.pause()
            if (playerStore.isFullScreen) {
                activateBlur()
            }
            break

        case window.YT.PlayerState.ENDED:
            const remainingSongs = playerStore.playlist.length - (playerStore.currentIndex + 1)

            if (remainingSongs < 3) {
                expandPlaylistWithMoreSongs()
            }

            if (playerStore.currentIndex < playerStore.playlist.length - 1) {
                if (isRepeatActive.value) {
                    ytPlayer?.seekTo(0, true)
                    ytPlayer?.playVideo()
                } else {
                    playerStore.next()
                }
            } else {
                if (isRepeatActive.value) {
                    ytPlayer?.seekTo(0, true)
                    ytPlayer?.playVideo()
                } else {
                    console.log('Fin de la playlist')
                }
            }
            break
    }
}

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
            cc_load_policy: 0,
            quality: 'hd1080',
            vq: 'hd1080',
            hl: 'es',
            autohide: 1,
            playsinline: 1,
            suggestedQuality: 'hd1080',
        },
        host: 'https://www.youtube.com',
        events: {
            onReady: handlePlayerReady,
            onStateChange: (e: any) => handlePlayerStateChange(e.data)
        }
    })
}

const fetchVideoAuthor = async (videoId: string): Promise<string | null> => {
    try {
        const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
        const data = await response.json()
        return data.author_name || null
    } catch (error) {
        console.error('Error obteniendo autor:', error)
        return null
    }
}

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

// ==================== TECLAS MULTIMEDIA MEJORADO ====================

// Listener global para teclas multimedia
const handleGlobalMediaKeys = (e: KeyboardEvent) => {
    const key = e.code;
    console.log('Tecla detectada en frontend:', key);

    switch (key) {
        case 'MediaPlayPause':
        case 'MediaPlay':
        case 'MediaPause':
            e.preventDefault();
            e.stopPropagation();
            console.log('Ejecutando play/pause desde tecla');
            togglePlayPause();
            break;
        case 'MediaNextTrack':
        case 'MediaTrackNext':
            e.preventDefault();
            e.stopPropagation();
            console.log('Ejecutando next desde tecla');
            next();
            break;
        case 'MediaPreviousTrack':
        case 'MediaTrackPrevious':
            e.preventDefault();
            e.stopPropagation();
            console.log('Ejecutando prev desde tecla');
            prev();
            break;
        case 'F7':
            e.preventDefault();
            console.log('Ejecutando prev desde F7');
            prev();
            break;
        case 'F8':
            e.preventDefault();
            console.log('Ejecutando play/pause desde F8');
            togglePlayPause();
            break;
        case 'F9':
            e.preventDefault();
            console.log('Ejecutando next desde F9');
            next();
            break;
    }
};

// Media Session API para integración con GNOME
const setupMediaSession = () => {
    if ('mediaSession' in navigator) {
        console.log('Media Session API disponible');

        navigator.mediaSession.setActionHandler('play', () => {
            console.log('MediaSession: play');
            togglePlayPause();
        });

        navigator.mediaSession.setActionHandler('pause', () => {
            console.log('MediaSession: pause');
            togglePlayPause();
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
            console.log('MediaSession: previous track');
            prev();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
            console.log('MediaSession: next track');
            next();
        });

        // Actualizar metadata cuando cambia la canción
        const updateMediaMetadata = () => {
            if (currentTrack.value) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: currentTrack.value.video_title,
                    artist: currentTrack.value.video_author || 'JearCast',
                    album: 'JearCast Music Player',
                    artwork: currentTrack.value.video_thumbnail ? [
                        { src: currentTrack.value.video_thumbnail, sizes: '96x96', type: 'image/jpeg' },
                        { src: currentTrack.value.video_thumbnail, sizes: '128x128', type: 'image/jpeg' },
                        { src: currentTrack.value.video_thumbnail, sizes: '192x192', type: 'image/jpeg' },
                        { src: currentTrack.value.video_thumbnail, sizes: '256x256', type: 'image/jpeg' },
                        { src: currentTrack.value.video_thumbnail, sizes: '384x384', type: 'image/jpeg' },
                        { src: currentTrack.value.video_thumbnail, sizes: '512x512', type: 'image/jpeg' },
                    ] : []
                });
            }
        };

        // Observar cambios de canción y estado
        watch([currentTrack, isPlaying], () => {
            updateMediaMetadata();
            navigator.mediaSession.playbackState = isPlaying.value ? 'playing' : 'paused';
        });

        updateMediaMetadata();
    } else {
        console.log('Media Session API no disponible');
    }
};

// Escuchar eventos de Electron para teclas multimedia
const setupElectronMediaKeys = () => {
    if (window.electron?.onMediaKey) {
        window.electron.onMediaKey((key: string) => {
            console.log('Electron media key:', key);
            switch (key) {
                case 'playpause':
                    togglePlayPause();
                    break;
                case 'next':
                    next();
                    break;
                case 'prev':
                    prev();
                    break;
            }
        });
    }
};

/* ==================== LOOP DE PROGRESO ==================== */
const startProgressLoop = (): void => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    const update = () => {
        if (isLocalPlayback.value) {
            const time = getLocalAudioCurrentTime()
            const total = getLocalAudioDuration()
            if (!isNaN(time) && !isNaN(total) && total > 0) {
                currentTime.value = time
                duration.value = total
                if (!isSeeking.value) progressValue.value = (time / total) * 100
            }
        } else if (ytPlayer) {
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
    if (isLocalPlayback.value) {
        if (isPlaying.value) {
            pauseLocalAudio();
        } else {
            resumeLocalAudio();
        }
    } else if (ytPlayer) {
        const state = ytPlayer.getPlayerState();
        if (state === window.YT.PlayerState.PLAYING) {
            ytPlayer.pauseVideo();
        } else if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.CUED) {
            ytPlayer.playVideo();
        }
    }
};

const handleSeek = (): void => {
    if (isLocalPlayback.value) {
        if (!isSeeking.value) return
        const total = getLocalAudioDuration()
        if (total > 0) {
            setLocalAudioCurrentTime((progressValue.value / 100) * total)
        }
    } else if (ytPlayer && isSeeking.value) {
        const total = ytPlayer.getDuration()
        if (total > 0) {
            ytPlayer.seekTo((progressValue.value / 100) * total, true)
        }
    }
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

const next = (): void => {
    stopAllPlayback();
    playerStore.next();
};
const prev = (): void => {
    stopAllPlayback();
    playerStore.prev();
};
const toggleShuffle = (): void => playerStore.toggleShuffle()
const toggleRepeat = (): void => { isRepeatActive.value = !isRepeatActive.value }

const toggleExpand = (): void => {
    isExpanded.value = !isExpanded.value
    if (isExpanded.value && !playerStore.isFullScreen) nextTick(setupLottie)
}

const closeFullScreen = (): void => {
    playerStore.closeFullScreen()
    if (lastMiniPosition.value) {
        position.value = lastMiniPosition.value
        lastMiniPosition.value = null
    } else {
        position.value = {
            x: MINI_PLAYER_OFFSET,
            y: window.innerHeight - PLAYER_HEIGHT - MINI_PLAYER_OFFSET
        }
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

const playLocalTrackFromStore = async (track: Track) => {
    if (!track.localPath) return;

    // ✅ DETENER YouTube primero
    if (ytPlayer) {
        try {
            ytPlayer.pauseVideo();
            console.log('YouTube pausado');
        } catch (e) {
            console.error('Error pausando YouTube:', e);
        }
    }

    // ✅ Destruir instancia de audio local anterior si existe
    destroyLocalAudio();

    isLocalPlayback.value = true;

    try {
        const audio = initLocalAudio();

        onLocalAudioTimeUpdate((time, dur) => {
            if (!isSeeking.value) {
                currentTime.value = time;
                duration.value = dur;
                progressValue.value = (time / dur) * 100;
            }
        });

        onLocalAudioEnded(() => {
            if (isRepeatActive.value) {
                setLocalAudioCurrentTime(0);
                resumeLocalAudio();
            } else {
                next();
            }
        });

        await playLocalTrack(track.localPath);

        addToRecentlyPlayed({
            video_id: track.video_id,
            video_title: track.video_title,
            video_thumbnail: track.video_thumbnail,
            video_author: track.video_author
        });

        startProgressLoop();

    } catch (error) {
        console.error('Error reproduciendo local:', error);
        isLocalPlayback.value = false;
    }
};

// Detener toda reproducción activa
const stopAllPlayback = () => {
    // Detener YouTube
    if (ytPlayer) {
        try {
            ytPlayer.pauseVideo();
        } catch (e) {
            console.error('Error pausando YouTube:', e);
        }
    }

    // Detener audio local
    if (isLocalPlayback.value) {
        try {
            pauseLocalAudio();
            // Destruir la instancia de audio para limpiar completamente
            destroyLocalAudio();
        } catch (e) {
            console.error('Error deteniendo audio local:', e);
        }
    }

    // Resetear estado
    isLocalPlayback.value = false;
    playerStore.pause();

    // Limpiar el contenedor de YouTube si es necesario
    if (playerContainer.value && ytPlayer) {
        // No destruir el player, solo pausar
    }

    console.log('Toda reproducción detenida');
};

/* ==================== WATCHERS ==================== */
watch(() => playerStore.isFullScreen, async (isFull) => {
    if (isFull) {
        lastMiniPosition.value = { ...position.value }
        deactivateBlur()
        scheduleBlurRemoval()
        const currentVideoId = currentTrack.value?.video_id
        if (currentVideoId) {
            prefetchAuthor(currentVideoId)
        }
        await nextTick()
        forceIframeResize()
        setTimeout(() => {
            forceIframeResize()
        }, 400)
    } else {
        if (isExpanded.value) {
            await nextTick()
            setupLottie()
        }
    }
})

watch(() => currentTrack.value, async (newTrack, oldTrack) => {
    if (!newTrack) return;

    // ✅ Si hay una canción anterior reproduciéndose, detenerla
    if (oldTrack && oldTrack !== newTrack) {
        stopAllPlayback();
    }

    if (playerStore.isFullScreen) {
        activateBlur();
    }

    if (newTrack.isLocal && newTrack.localPath) {
        await playLocalTrackFromStore(newTrack);
    } else if (newTrack.video_id && !newTrack.isLocal) {
        // Si había audio local reproduciéndose, asegurarse de detenerlo
        if (isLocalPlayback.value) {
            destroyLocalAudio();
            isLocalPlayback.value = false;
        }

        isLocalPlayback.value = false;
        prefetchAuthor(newTrack.video_id);
        await loadYouTubeAPI();
        await nextTick();
        createPlayer(newTrack.video_id);
    }
}, { immediate: true });
watch(() => animationStore.currentAnimationId, async (newId, oldId) => {
    if (newId !== oldId && !playerStore.isFullScreen && isExpanded.value) {
        await nextTick()
        setupLottie()
    }
})

watch(() => playerStore.currentIndex, (newIndex) => {
    const remaining = playerStore.playlist.length - (newIndex + 1)
    if (remaining === 0 && !isExpanding) {
        console.log('Quedan 0 canciones, precargando más...')
        expandPlaylistWithMoreSongs()
    }
}, { deep: true })

watch(() => currentTrack.value, (newTrack) => {
    if (newTrack && playerStore.isPlaying) {
        addToRecentlyPlayed({
            video_id: newTrack.video_id,
            video_title: newTrack.video_title,
            video_thumbnail: newTrack.video_thumbnail,
            video_author: newTrack.video_author
        })
        console.log(`Canción cambiada, guardada en historial: ${newTrack.video_title}`)
    }
}, { deep: true })

watch(() => currentTrack.value, () => {
    currentLyrics.value = null
    if (showLyrics.value) {
        loadLyrics()
    }
})

// PARA ACTUALIZAR EL ESTADO DE LOS BOTONES:
watch([isPlaying, currentTrack, currentTime], () => {
    if (window.electron?.ipcRenderer?.send) {
        window.electron.ipcRenderer.send('player-state-change', {
            state: isPlaying.value ? 'playing' : 'paused',
            title: currentTrack.value?.video_title || '',
            artist: currentTrack.value?.video_author || '',
            thumbnail: currentTrack.value?.video_thumbnail || '',
            duration: duration.value,
            position: currentTime.value
        });
    }
}, { deep: true });

/* ==================== LIFECYCLE ==================== */
onMounted(() => {
    // Listener para teclas multimedia (nuevo)
    window.addEventListener('keydown', handleGlobalMediaKeys);
    window.addEventListener('keydown', handleKeyPress);

    // Setup Media Session API (nuevo)
    setupMediaSession();

    // Setup Electron media keys (nuevo)
    setupElectronMediaKeys();

    // Setup Lottie (ya existente)
    if (!playerStore.isFullScreen && isExpanded.value) setupLottie();

    console.log('Player mounted, listeners registrados');
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleGlobalMediaKeys);
    window.removeEventListener('keydown', handleKeyPress);

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (resizeObserver) resizeObserver.disconnect();
    clearBlurTimers();
    lottieInstance?.destroy();

    console.log('Player unmounted, listeners eliminados');
});
</script>
<style scoped>
@import url('@/assets/css/player-styles.css');

.debug-lyrics-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    z-index: 20000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

.debug-lyrics-content {
    background: #1a1a1a;
    border: 2px solid #1db954;
    border-radius: 20px;
    padding: 2rem;
    max-width: 90%;
    width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.debug-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: #ff4d4d;
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.2s ease;
}

.debug-close:hover {
    transform: scale(1.1);
    background: #ff6666;
}

.debug-lyrics-content h3 {
    color: white;
    margin: 0 0 0.5rem 0;
    font-size: 1.3rem;
    padding-right: 2rem;
}

.debug-lyrics-content h4 {
    color: rgba(255, 255, 255, 0.7);
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: normal;
}

.debug-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 1rem 0;
}

.debug-info {
    background: rgba(29, 185, 84, 0.1);
    border-radius: 8px;
    padding: 0.75rem;
    margin-bottom: 1rem;
}

.debug-info p {
    margin: 0.25rem 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
}

.debug-info strong {
    color: #1db954;
}

.debug-section h5 {
    color: #1db954;
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
}

.debug-lines {
    max-height: 400px;
    overflow-y: auto;
}

.debug-line {
    padding: 0.5rem;
    color: white;
    font-size: 0.85rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-family: monospace;
}

.debug-time {
    color: #1db954;
    font-weight: bold;
    margin-right: 0.75rem;
    font-family: monospace;
}

.debug-lines::-webkit-scrollbar {
    width: 6px;
}

.debug-lines::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
}

.debug-lines::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
}

/* ==================== INFO DEL AUTOR - VERSIÓN SIMPLE Y CENTRADA ==================== */
/* ==================== LETRAS - DENTRO DEL REPRODUCTOR ==================== */
.lyrics-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(20px);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 100;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    overflow: hidden;
}

.unified-player.fullscreen-mode .lyrics-container {
    border-radius: 0;
}

.lyrics-container.active {
    transform: translateX(0);
}

.lyrics-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    flex-shrink: 0;
}

.close-lyrics {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.close-lyrics:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.1);
}

.lyrics-header h5 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
    padding-right: 2rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.artist {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
}

.lyrics-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

.synced-lyrics {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.lyrics-line {
    font-size: 1rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.2s ease;
    padding: 0.25rem 0;
}

.lyrics-line.active {
    color: var(--accent-color);
    font-size: 1.2rem;
    font-weight: 500;
    text-shadow: 0 0 10px rgba(29, 185, 84, 0.3);
}

/* Botón de letras en el header */
.lyrics-toggle {
    margin-left: auto;
}

.lyrics-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 6px 12px;
    color: white;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.8rem;
}

.lyrics-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: var(--accent-color);
}

.lyrics-btn.active {
    background: var(--accent-color);
    border-color: var(--accent-color);
    color: white;
}

/* Modo con letras - el video se reduce */
.video-section.fullscreen.with-lyrics {
    width: 60%;
    transition: width 0.3s ease;
}

/* Responsive */
@media (max-width: 1024px) {
    .video-section.fullscreen.with-lyrics {
        width: 55%;
    }
}

@media (max-width: 768px) {
    .video-section.fullscreen.with-lyrics {
        width: 100%;
    }

    .lyrics-btn span {
        display: none;
    }

    .lyrics-btn {
        padding: 6px;
        border-radius: 50%;
    }

    .lyrics-line {
        font-size: 0.9rem;
    }

    .lyrics-line.active {
        font-size: 1rem;
    }
}

.author-info-section {
    width: 100%;
    margin: 8px 0;
    display: flex;
    justify-content: center;
}

.author-info-section.fullscreen {
    margin: 16px 0 12px 0;
}

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
    width: fit-content;
    max-width: 90%;
}

.author-icon {
    font-size: 1.1rem;
    color: #b3b3b3;
    flex-shrink: 0;
}

.author-name {
    color: #e0e0e0;
    font-size: 0.9rem;
    font-weight: 400;
    letter-spacing: 0.3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 250px;
}

.author-badge {
    color: var(--accent-color);
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: transparent;
    border: none;
    padding: 0;
    flex-shrink: 0;
}

.author-badge.bg-secondary {
    color: #808080 !important;
    background: transparent !important;
    border: none !important;
}

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
        font-size: 0.65rem;
    }

    .author-icon {
        font-size: 1rem;
    }
}

.local-player-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.3) 100%);
    color: white;
    text-align: center;
    padding: 2rem;
}

.local-player-placeholder i {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.7;
}

.local-player-placeholder p {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.local-player-placeholder small {
    font-size: 0.85rem;
    opacity: 0.6;
}
</style>
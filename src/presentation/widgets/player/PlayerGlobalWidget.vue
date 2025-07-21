<template>
    <div class="floating-player" :class="{ expanded: isExpanded }"
        :style="{ top: `${position.y}px`, left: `${position.x}px` }" @mousedown="startDrag">
        <div class="player-header d-flex justify-content-between align-items-center">
            <span class="title">{{ currentTrack?.video_title || 'Sin reproducción' }}</span>
            <button @click="toggleExpand" class="btn btn-sm btn-toggle"
                style="background-color: #ffffff !important; border-radius: 1.0rem;">
                <i :class="isExpanded ? 'bi bi-chevron-down' : 'bi bi-chevron-up'"
                    style="background-color: #ffffff; color: red;"></i>
            </button>
        </div>

        <div v-show="isExpanded && currentTrack" class="iframe-container">
            <div class="thumbnail">
                <div ref="playerContainer" id="yt-player" class="iframe-element" />
                <div class="iframe-overlay" v-show="showOverlay" />
                <div class="iframe-click-guard" :style="{
                    pointerEvents: allowClickThrough ? 'none' : 'auto',
                    opacity: allowClickThrough ? 0 : 1
                }" />
            </div>
        </div>
        <div v-if="isExpanded" class="player-body" style="margin-top: 20px ;">
            <div v-show="isExpanded" class="d-flex justify-content-center mt-2">
                <div ref="lottieContainer" style="width: 200px; height: 70px;"></div>
            </div>

            <!-- Progress Bar -->
            <div v-show="isExpanded" class="d-flex justify-content-between px-2 text-white small">
                <span>{{ currentTimeFormatted }}</span>
                <span>{{ durationFormatted }}</span>
            </div>
            <!-- Barra de progreso visible -->
            <div v-show="isExpanded" class="d-flex align-items-center justify-content-center px-2 mt-1">
                <input ref="progressBar" type="range" min="0" max="100" step="0.1" class="form-range w-100"
                    @input="seekToProgress" style="accent-color: red" />
            </div>
            <div class="controls mt-3">
                <button @click="prev" class="control-button">
                    <i class="bi bi-skip-backward-fill"></i>
                </button>
                <button @click="play" class="control-button play">
                    <i class="bi bi-play-fill"></i>
                </button>
                <button @click="pause" class="control-button pause">
                    <i class="bi bi-pause-fill"></i>
                </button>
                <button @click="next" class="control-button">
                    <i class="bi bi-skip-forward-fill"></i>
                </button>
            </div>

        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { usePlayerStore } from '@/stores/player-store'
import lottie from 'lottie-web'
import animationData from '@/assets/anim/animation-sound2.json'

const lottieContainer = ref<HTMLElement | null>(null)
const progressBar = ref<HTMLInputElement | null>(null)
const playerStore = usePlayerStore()
const currentTrack = computed(() => playerStore.currentTrack)
const isExpanded = ref(true)
const showOverlay = ref(true)
const allowClickThrough = ref(false)
const playerContainer = ref<HTMLDivElement | null>(null)
let lottieInstance: any = null
let progressInterval: any = null
const currentTime = ref(0)
const duration = ref(0)

const currentTimeFormatted = computed(() => formatTime(currentTime.value))
const durationFormatted = computed(() => formatTime(duration.value))

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function setupLottie() {
    if (lottieInstance) {
        lottieInstance.destroy()
        lottieInstance = null
    }

    if (lottieContainer.value) {
        lottieInstance = lottie.loadAnimation({
            container: lottieContainer.value,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData
        })
    }
}

function setupProgressBar() {
    progressInterval && clearInterval(progressInterval)

    progressInterval = setInterval(() => {
        if (ytPlayer && ytPlayer.getCurrentTime && ytPlayer.getDuration) {
            const time = ytPlayer.getCurrentTime()
            const total = ytPlayer.getDuration()
            const value = (time / total) * 100

            currentTime.value = time
            duration.value = total

            if (progressBar.value) {
                progressBar.value.value = value.toString()
            }
        }
    }, 200)
}

function seekToProgress() {
    if (progressBar.value && ytPlayer?.seekTo && ytPlayer.getDuration) {
        const percentage = parseFloat(progressBar.value.value)
        const duration = ytPlayer.getDuration()
        ytPlayer.seekTo((percentage / 100) * duration, true)
    }
}

let ytPlayer: YT.Player | null = null
let overlayTimeout: ReturnType<typeof setTimeout> | null = null
let checkEndInterval: ReturnType<typeof setInterval> | null = null

declare global {
    interface Window {
        YT: typeof YT
        onYouTubeIframeAPIReady: () => void
    }
}

declare namespace YT {
    enum PlayerState {
        UNSTARTED = -1,
        ENDED = 0,
        PLAYING = 1,
        PAUSED = 2,
        BUFFERING = 3,
        CUED = 5
    }

    class Player {
        constructor(elementId: string | HTMLElement, options: any)
        loadVideoById(videoId: string): void
        playVideo(): void
        pauseVideo(): void
        unMute(): void
        destroy(): void
        getCurrentTime(): number
        getDuration(): number
        getPlayerState(): YT.PlayerState
        seekTo(seconds: number, allowSeekAhead: boolean): void
    }
}

const toggleExpand = () => {
    isExpanded.value = !isExpanded.value

    nextTick(() => {
        if (isExpanded.value && currentTrack.value) {
            setupLottie()
        }
    })
}

const position = ref({ x: 20, y: window.innerHeight - 250 })
let isDragging = false
let dragOffset = { x: 0, y: 0 }

const startDrag = (e: MouseEvent) => {
    isDragging = true
    dragOffset = {
        x: e.clientX - position.value.x,
        y: e.clientY - position.value.y
    }
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', stopDrag)
}

const onDrag = (e: MouseEvent) => {
    if (isDragging) {
        position.value = {
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
        }
    }
}

const stopDrag = () => {
    isDragging = false
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', stopDrag)
}

function updateOverlayState() {
    if (!ytPlayer) return
    const remainingTime = ytPlayer.getDuration() - ytPlayer.getCurrentTime()
    const isPlaying = ytPlayer.getPlayerState() === window.YT.PlayerState.PLAYING
    const shouldHide = remainingTime > 20 && isPlaying
    showOverlay.value = !shouldHide
    allowClickThrough.value = false
}

function resetOverlayTimer() {
    overlayTimeout && clearTimeout(overlayTimeout)
    overlayTimeout = setTimeout(() => {
        updateOverlayState()
    }, 7000)
}

function clearIntervals() {
    overlayTimeout && clearTimeout(overlayTimeout)
    checkEndInterval && clearInterval(checkEndInterval)
}

const loadYouTubeAPI = () => new Promise<void>((resolve) => {
    if (window.YT?.Player) return resolve()
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => resolve()
})

function createPlayer(videoId: string) {
    if (!playerContainer.value) return
    if (ytPlayer) {
        ytPlayer.destroy()
        ytPlayer = null
    }

    ytPlayer = new window.YT.Player(playerContainer.value, {
        height: '160',
        width: '100%',
        videoId,
        playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1
        },
        events: {
            onReady: (event: any) => {
                event.target.unMute()
                event.target.playVideo()
                showOverlay.value = true
                allowClickThrough.value = false
                resetOverlayTimer()
                setupLottie()
                setupProgressBar()
            },
            onStateChange: (event: any) => {
                const state = event.data
                const playing = window.YT.PlayerState.PLAYING
                const paused = window.YT.PlayerState.PAUSED
                const ended = window.YT.PlayerState.ENDED

                if (state === playing) {
                    showOverlay.value = true
                    allowClickThrough.value = false
                    resetOverlayTimer()
                    checkEndInterval && clearInterval(checkEndInterval)
                    checkEndInterval = setInterval(updateOverlayState, 7000)
                    if (lottieInstance) lottieInstance.play()
                }

                if (state === paused) {
                    showOverlay.value = true
                    allowClickThrough.value = false
                    clearIntervals()
                    if (lottieInstance) lottieInstance.pause()
                }

                if (state === ended) {
                    clearIntervals()
                    if (lottieInstance) lottieInstance.pause()
                    playerStore.next() // <-- Reproducir siguiente canción al finalizar
                }
            },
            onError: (err: any) => console.error('[YT] Error:', err)
        }
    })
}

watch(() => currentTrack.value?.video_id, async (videoId) => {
    if (videoId) {
        await loadYouTubeAPI()
        await nextTick()
        createPlayer(videoId)
    }
})

const play = () => {
    ytPlayer?.playVideo()
    playerStore.play()
}

const pause = () => {
    ytPlayer?.pauseVideo()
    playerStore.pause()
}

const next = () => playerStore.next()
const prev = () => playerStore.prev()

onBeforeUnmount(() => {
    stopDrag()
    clearIntervals()
    lottieInstance?.destroy()
    clearInterval(progressInterval)
})
</script>

<style scoped>
.floating-player {
    position: fixed;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    background-color: rgba(65, 65, 65, 0.568);
    border: 0.5px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.3rem;
    color: white;
    padding: 10px;
    z-index: 2000;
    height: auto;
    width: 280px;
    cursor: grab;
    user-select: none;
    box-shadow: 0 0 10px rgba(194, 194, 194, 0.4);
}

.player-header {
    font-weight: bold;
    font-size: 14px;
}

.iframe-container {
    position: relative;
    width: 100%;
    height: auto;
    margin-top: 8px;
}

.thumbnail {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
}

.iframe-element {
    width: 100%;
    height: 100%;
    z-index: 0;
    position: absolute;
}

.iframe-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    bottom: 0;
    backdrop-filter: blur(12px);
    background-color: rgba(0, 0, 0, 0.4);
    z-index: 2;
    pointer-events: none;
}

.iframe-click-guard {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.001);
    /* invisible pero clickeable */
    z-index: 3;
    transition: opacity 0.3s ease;
    user-select: none;
    touch-action: none;
}

.controls {
    display: flex;
    justify-content: space-around;
    margin-top: 10px;
}

.control-button {
    background: #f0f0f3;
    border: none;
    border-radius: 50%;
    width: 38px;
    height: 38px;
    box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.1),
        -4px -4px 12px rgba(255, 255, 255, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #333;
    font-size: 20px;
    transition: all 0.2s ease;
}

.control-button:hover {
    box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.1),
        inset -2px -2px 5px rgba(255, 255, 255, 0.7);
    transform: scale(1.05);
}

.controls {
    display: flex;
    justify-content: space-between;
    padding: 0 20px;
    margin-top: 16px;
    gap: 10px;
}
</style>

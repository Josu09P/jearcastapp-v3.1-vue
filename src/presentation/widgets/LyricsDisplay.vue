<template>
    <div class="lyrics-container" :class="{ 'active': visible, 'two-columns': twoColumnLayout }">
        <div class="lyrics-header">
            <div class="lyrics-header-main">
                <div class="lyrics-header-text">
                    <h5>{{ lyrics?.title || 'Letras' }}</h5>
                    <span class="artist">{{ lyrics?.artist }}</span>
                </div>

                <!-- Controles de Sincronización y Desfase -->
                <div v-if="lyrics && lyrics.syncedLyrics.length > 0" class="lyrics-sync-controls">
                    <button
                        class="btn-sync-toggle"
                        :class="{ 'is-synced': isSyncEnabled }"
                        @click="toggleSync"
                        :title="isSyncEnabled ? 'Sincronización activa (Clic para activar Modo Libre y desplazarte libremente)' : 'Modo Libre activo (Clic para activar seguimiento sincronizado)'"
                    >
                        <i :class="isSyncEnabled ? 'bi bi-lightning-charge-fill' : 'bi bi-pause-circle'"></i>
                        <span class="sync-label">{{ isSyncEnabled ? 'Sincronizada' : 'Modo Libre' }}</span>
                    </button>

                    <!-- Micro-ajuste de Desfase / Timing Offset -->
                    <div v-if="isSyncEnabled" class="offset-adjust-group" title="Ajuste fino de sincronización (adelantar o atrasar)">
                        <button class="btn-offset" @click="adjustOffset(-0.5)" title="Atrasar letra 0.5s">
                            -0.5s
                        </button>
                        <span v-if="timeOffset !== 0" class="offset-val" :class="{ 'offset-plus': timeOffset > 0, 'offset-minus': timeOffset < 0 }" @click="resetOffset" title="Clic para restablecer desfase a 0s">
                            {{ timeOffset > 0 ? `+${timeOffset.toFixed(1)}s` : `${timeOffset.toFixed(1)}s` }}
                        </span>
                        <button class="btn-offset" @click="adjustOffset(0.5)" title="Adelantar letra 0.5s">
                            +0.5s
                        </button>
                    </div>
                </div>
            </div>

            <div class="lyrics-header-actions">
                <button class="close-lyrics" @click="$emit('close')" title="Cerrar letras">
                    <i class="bi bi-x-lg" style="font-size: 10px;"></i>
                </button>
            </div>
        </div>

        <div class="lyrics-content" ref="lyricsContainer">
            <div v-if="loading" class="lyrics-loading">
                <div class="spinner-border text-light"></div>
                <p>Cargando letras...</p>
            </div>

            <div v-else-if="!lyrics" class="lyrics-error">
                <i class="bi bi-music-note-beamed"></i>
                <p>No se encontraron letras para esta canción</p>
            </div>

            <div v-else-if="lyrics.syncedLyrics.length > 0" class="synced-lyrics" :class="{ 'free-mode': !isSyncEnabled }">
                <div v-for="(line, index) in lyrics.syncedLyrics" :key="index" :ref="el => setLineRef(el, index)"
                    class="lyrics-line clickable" :class="{ active: isSyncEnabled && currentLineIndex === index }"
                    @click="onLineClick(line.time)"
                    :title="`Saltar a ${Math.floor(line.time / 60)}:${String(Math.floor(line.time % 60)).padStart(2, '0')}`">
                    {{ line.text }}
                </div>
            </div>

            <div v-else class="plain-lyrics">
                <p v-for="(paragraph, index) in lyrics.plainLyrics.split('\n')" :key="index">
                    {{ paragraph }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { LyricsData } from '@/data/services/youtube/LyricsService'

const props = defineProps<{
    lyrics: LyricsData | null
    loading: boolean
    visible: boolean
    currentTime: number
    twoColumnLayout?: boolean
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'seek', time: number): void
}>()

const isSyncEnabled = ref(true)
const timeOffset = ref(0)
const currentLineIndex = ref(-1)
const lyricsContainer = ref<HTMLElement | null>(null)
const lineRefs = ref<(HTMLElement | null)[]>([])

const setLineRef = (el: any, index: number) => {
    if (el) {
        lineRefs.value[index] = el
    }
}

const scrollToLine = (index: number) => {
    if (index >= 0 && lineRefs.value[index] && lyricsContainer.value) {
        const activeLine = lineRefs.value[index]
        const container = lyricsContainer.value
        const lineHeight = activeLine!.clientHeight
        const containerHeight = container.clientHeight

        const offsetTop = activeLine!.offsetTop
        const targetScroll = offsetTop - (containerHeight / 2) + (lineHeight / 2)

        container.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: 'smooth'
        })
    }
}

const updateLineForTime = (rawTime: number) => {
    if (!props.lyrics?.syncedLyrics.length) return

    const effectiveTime = Math.max(0, rawTime + timeOffset.value)

    let newIndex = -1
    for (let i = props.lyrics.syncedLyrics.length - 1; i >= 0; i--) {
        if (effectiveTime >= props.lyrics.syncedLyrics[i].time) {
            newIndex = i
            break
        }
    }

    currentLineIndex.value = newIndex
    if (isSyncEnabled.value && newIndex >= 0) {
        scrollToLine(newIndex)
    }
}

const toggleSync = () => {
    isSyncEnabled.value = !isSyncEnabled.value
    if (isSyncEnabled.value) {
        updateLineForTime(props.currentTime)
    }
}

const adjustOffset = (delta: number) => {
    timeOffset.value = Math.round((timeOffset.value + delta) * 10) / 10
    updateLineForTime(props.currentTime)
}

const resetOffset = () => {
    timeOffset.value = 0
    updateLineForTime(props.currentTime)
}

const onLineClick = (time: number) => {
    emit('seek', time)
}

// Actualizar línea actual basada en el tiempo + offset
watch(() => props.currentTime, (rawTime) => {
    updateLineForTime(rawTime)
})

// Resetear cuando cambia la canción
watch(() => props.lyrics, () => {
    currentLineIndex.value = -1
    timeOffset.value = 0
    if (lyricsContainer.value) {
        lyricsContainer.value.scrollTop = 0
    }
})
</script>

<style scoped>
.lyrics-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.482) !important;
    backdrop-filter: blur(20px);
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 200;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    overflow: hidden;
    pointer-events: auto;
    padding-top: 12px !important;
}

/* Modo two-columns (cuando está en el layout de dos columnas) */
.lyrics-container.two-columns {
    position: relative;
    background: rgba(0, 0, 0, 0.785);
    backdrop-filter: blur(20px);
    border-radius: 0;
    transform: none;
    pointer-events: auto;
}

.lyrics-container.two-columns.active {
    transform: none;
}

.unified-player.fullscreen-mode .lyrics-container {
    border-radius: 0;
}

.lyrics-container.active {
    transform: translateX(0);
}

/* Header */
.lyrics-header {
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    position: relative;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    background: rgba(0, 0, 0, 0.25);
}

.lyrics-container.two-columns .lyrics-header {
    padding: 0.9rem 1.5rem;
    background: rgba(0, 0, 0, 0.5);
}

.lyrics-header-main {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex: 1;
    min-width: 0;
    flex-wrap: wrap;
}

.lyrics-header-text {
    min-width: 0;
}

.lyrics-header h5 {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: white;
}

.artist {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    display: block;
}

.lyrics-sync-controls {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
}

.btn-sync-toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.8rem;
    border-radius: 20px;
    font-size: 0.78rem;
    font-weight: 500;
    border: none !important;
    outline: none !important;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
}

.btn-sync-toggle:hover {
    background: rgba(255, 255, 255, 0.16);
    color: #fff;
}

.btn-sync-toggle.is-synced {
    background: rgba(62, 150, 93, 0.25);
    color: #4ade80;
}

.offset-adjust-group {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 2px 5px;
    border: none !important;
    outline: none !important;
    user-select: none;
}

.btn-offset {
    background: none;
    border: none !important;
    outline: none !important;
    color: rgba(255, 255, 255, 0.75);
    font-size: 0.68rem;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
}

.btn-offset:hover {
    background: rgba(255, 255, 255, 0.16);
    color: #fff;
}

.offset-val {
    font-size: 0.68rem;
    font-weight: 600;
    padding: 1px 4px;
    border-radius: 4px;
    cursor: pointer;
}

.offset-plus {
    color: #38bdf8;
}

.offset-minus {
    color: #f87171;
}

.lyrics-header-actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.close-lyrics {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    font-size: 1.1rem;
    cursor: pointer;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.close-lyrics:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.08);
}

/* Contenido de letras - CENTRADO VERTICALMENTE */
.lyrics-content {
    flex: 1;
    overflow-y: auto;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    scroll-behavior: smooth;
}

/* Cuando no hay suficientes líneas para centrar, mantener el scroll normal */
.lyrics-content:has(.synced-lyrics) {
    justify-content: flex-start;
}

/* Para letras sincronizadas, mantener el scroll normal pero centrar visualmente */
.synced-lyrics {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem 0;
}

/* Para letras normales (plain) también centrar */
.plain-lyrics {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
}

.plain-lyrics p {
    margin-bottom: 1rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.7);
    font-size: 1rem;
}

/* Líneas de letras */
.lyrics-line {
    font-size: 1rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.55);
    transition: all 0.2s ease;
    padding: 0.4rem 0.8rem;
    border-radius: 8px;
    cursor: default;
    text-align: center;
    letter-spacing: 0.3px;
}

.lyrics-line.clickable {
    cursor: pointer;
}

.lyrics-line.clickable:hover {
    color: rgba(255, 255, 255, 0.95);
    background: rgba(255, 255, 255, 0.05);
    transform: scale(1.015);
}

.lyrics-line.active {
    color: var(--accent-color, #3e965d);
    font-size: 1.2rem;
    font-weight: 600;
    text-shadow: 0 0 20px rgba(62, 150, 93, 0.4);
    transform: scale(1.02);
    background: rgba(255, 255, 255, 0.05);
}

/* Scrollbar personalizada */
.lyrics-content::-webkit-scrollbar {
    width: 6px;
}

.lyrics-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
}

.lyrics-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
}

.lyrics-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* Estados de carga y error */
.lyrics-loading,
.lyrics-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    gap: 1rem;
}

.lyrics-loading i,
.lyrics-error i {
    font-size: 3rem;
    opacity: 0.5;
}

/* Responsive */
@media (max-width: 768px) {
    .lyrics-content {
        padding: 1.5rem 1rem;
    }

    .synced-lyrics {
        gap: 0.6rem;
    }

    .lyrics-line {
        font-size: 0.9rem;
        padding: 0.3rem 0;
    }

    .lyrics-line.active {
        font-size: 1.05rem;
    }

    .plain-lyrics p {
        font-size: 0.9rem;
    }
}

@media (min-width: 1200px) {
    .synced-lyrics {
        max-width: 700px;
    }

    .lyrics-line {
        font-size: 1.05rem;
    }

    .lyrics-line.active {
        font-size: 1.25rem;
    }
}
</style>
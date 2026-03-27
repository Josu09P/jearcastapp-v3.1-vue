<template>
    <div class="lyrics-container" :class="{ 'active': visible }">
        <div class="lyrics-header">
            <button class="close-lyrics" @click="$emit('close')">
                <i class="bi bi-x-lg"></i>
            </button>
            <h5>{{ lyrics?.title || 'Letras' }}</h5>
            <span class="artist">{{ lyrics?.artist }}</span>
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

            <div v-else-if="lyrics.syncedLyrics.length > 0" class="synced-lyrics">
                <div v-for="(line, index) in lyrics.syncedLyrics" :key="index" :ref="el => setLineRef(el, index)"
                    class="lyrics-line" :class="{ active: currentLineIndex === index }">
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
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { LyricsData } from '@/data/services/youtube/LyricsService'

const props = defineProps<{
    lyrics: LyricsData | null
    loading: boolean
    visible: boolean
    currentTime: number
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()

const currentLineIndex = ref(-1)
const lyricsContainer = ref<HTMLElement | null>(null)
const lineRefs = ref<(HTMLElement | null)[]>([])

const setLineRef = (el: any, index: number) => {
    if (el) {
        lineRefs.value[index] = el
    }
}

// Actualizar línea actual basada en el tiempo
watch(() => props.currentTime, (time) => {
    if (!props.lyrics?.syncedLyrics.length) return

    // Buscar la línea que corresponde al tiempo actual
    let newIndex = -1
    for (let i = props.lyrics.syncedLyrics.length - 1; i >= 0; i--) {
        if (time >= props.lyrics.syncedLyrics[i].time) {
            newIndex = i
            break
        }
    }

    if (newIndex !== currentLineIndex.value) {
        currentLineIndex.value = newIndex

        // Scroll a la línea activa
        if (newIndex >= 0 && lineRefs.value[newIndex] && lyricsContainer.value) {
            const activeLine = lineRefs.value[newIndex]
            const container = lyricsContainer.value
            const offsetTop = activeLine!.offsetTop - container.offsetTop
            const targetScroll = offsetTop - (container.clientHeight / 2) + (activeLine!.clientHeight / 2)

            container.scrollTo({
                top: Math.max(0, targetScroll),
                behavior: 'smooth'
            })
        }
    }
})

// Resetear cuando cambia la canción
watch(() => props.lyrics, () => {
    currentLineIndex.value = -1
    if (lyricsContainer.value) {
        lyricsContainer.value.scrollTop = 0
    }
})
</script>

<style scoped>
.lyrics-container {
    position: fixed;
    top: 0;
    right: 0;
    width: 40%;
    height: 100vh;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(20px);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 1050;
    display: flex;
    flex-direction: column;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.lyrics-container.active {
    transform: translateX(0);
}

.lyrics-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
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

.lyrics-loading,
.lyrics-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
}

.lyrics-loading i,
.lyrics-error i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
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

.plain-lyrics {
    white-space: pre-wrap;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.7);
}

/* Scrollbar */
.lyrics-content::-webkit-scrollbar {
    width: 6px;
}

.lyrics-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
}

.lyrics-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
}

.lyrics-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* Responsive */
@media (max-width: 1024px) {
    .lyrics-container {
        width: 50%;
    }
}

@media (max-width: 768px) {
    .lyrics-container {
        width: 100%;
    }

    .lyrics-line {
        font-size: 0.9rem;
    }

    .lyrics-line.active {
        font-size: 1rem;
    }
}
</style>
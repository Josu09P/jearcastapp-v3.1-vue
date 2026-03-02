<template>
    <Transition name="fade-slide">
        <div v-if="show" class="fullscreen-player-overlay">
            <div class="background-blur" :style="{ backgroundImage: `url(${currentTrack?.video_thumbnail})` }">
            </div>

            <div class="content-container">
                <div class="header-fs d-flex justify-content-between align-items-center">
                    <button @click="$emit('close')" class="btn-close-fs">
                        <i class="bi bi-chevron-down"></i>
                    </button>
                    <div class="text-center">
                        <small class="text-uppercase tracking-widest text-secondary opacity-75">Reproduciendo
                            ahora</small>
                        <h5 class="mb-0 text-white fw-bold">{{ currentTrack?.video_title }}</h5>
                    </div>
                    <div style="width: 40px;"></div>
                </div>

                <div class="video-section-fs">
                    <div class="video-wrapper">
                        <div class="iframe-placeholder">
                            <slot name="video-content"></slot>
                        </div>
                        <div class="video-veil"></div>
                    </div>
                </div>

                <div class="controls-section-fs">
                    <div class="info-track mb-4 text-start">
                        <h2 class="display-5 fw-bold text-white mb-1">{{ currentTrack?.video_title }}</h2>
                        <p class="fs-5 text-secondary opacity-50">YouTube Music Experience</p>
                    </div>

                    <div class="progress-bar-fs mb-4">
                        <input type="range" min="0" max="100" step="0.1" :value="progress" @input="handleSeek"
                            class="form-range custom-range-fs" />
                        <div class="d-flex justify-content-between mt-2 text-secondary font-monospace">
                            <span>{{ currentTime }}</span>
                            <span>{{ duration }}</span>
                        </div>
                    </div>

                    <div class="main-buttons-container">
                        <button @click="playerStore.toggleShuffle()" class="btn-fs-secondary"
                            :class="{ 'active': playerStore.isShuffling }">
                            <i class="bi bi-shuffle"></i>
                        </button>

                        <button @click="playerStore.prev()" class="btn-fs-main">
                            <i class="bi bi-skip-start-fill"></i>
                        </button>

                        <button @click="$emit('toggle-play')" class="btn-fs-play">
                            <i :class="isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill'"></i>
                        </button>

                        <button @click="playerStore.next()" class="btn-fs-main">
                            <i class="bi bi-skip-end-fill"></i>
                        </button>

                        <button class="btn-fs-secondary">
                            <i class="bi bi-repeat"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '@/stores/player-store'

// Definimos las propiedades que recibe del padre
const props = defineProps<{
    show: boolean;
    isPlaying: boolean;
    progress: number;
    currentTime: string;
    duration: string;
}>();

// Definimos los eventos que puede emitir
const emit = defineEmits(['close', 'toggle-play', 'seek']);

const playerStore = usePlayerStore();
const currentTrack = computed(() => playerStore.currentTrack);

// Función para cuando el usuario mueve la barra de progreso
const handleSeek = (event: Event) => {
    const target = event.target as HTMLInputElement;
    emit('seek', parseFloat(target.value));
};
</script>

<style scoped>
/* Estilos base que ya tienes */
@import '@/assets/css/player-fullscreen-styles.css';

/* Añadidos para botones */
.header-fs {
    padding-bottom: 20px;
}

.btn-close-fs {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s;
}

.btn-close-fs:hover {
    background: rgba(255, 255, 255, 0.2);
}

.main-buttons-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 30px;
}

.btn-fs-main {
    background: transparent;
    border: none;
    color: white;
    font-size: 2.5rem;
    transition: transform 0.2s;
}

.btn-fs-secondary {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 1.5rem;
}

.btn-fs-secondary.active {
    color: #1db954;
    /* Color activo */
}
</style>
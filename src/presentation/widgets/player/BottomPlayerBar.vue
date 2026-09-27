<template>
  <div class="bottom-player-bar d-flex align-items-center justify-content-between px-3">
    <!-- SECCIÓN IZQUIERDA: Portada + Info + Like -->
    <div class="left-section d-flex align-items-center gap-3">
      <div class="track-thumb-wrapper" @click="$emit('open-fullscreen')" title="Ampliar a pantalla completa">
        <img
          v-if="currentTrack?.video_thumbnail"
          :src="currentTrack.video_thumbnail"
          :alt="currentTrack.video_title"
          class="track-thumb"
        />
        <div v-else class="track-thumb-placeholder">
          <i class="bi bi-music-note-beamed"></i>
        </div>
        <div class="thumb-hover-overlay">
          <i class="bi bi-arrows-angle-expand"></i>
        </div>
      </div>

      <div class="track-info d-flex flex-column justify-content-center overflow-hidden">
        <span
          class="track-title text-truncate fw-semibold"
          @click="$emit('open-fullscreen')"
          :title="currentTrack?.video_title || 'Sin reproducción'"
        >
          {{ currentTrack?.video_title || 'Sin reproducción' }}
        </span>
        <span
          class="track-artist text-truncate"
          :title="currentTrack?.video_author || 'Desconocido'"
        >
          {{ currentTrack?.video_author || 'Cargando artista...' }}
        </span>
      </div>

      <button
        v-if="currentTrack"
        class="btn-icon btn-like flex-shrink-0"
        :class="{ 'is-favorite': isFavorite }"
        @click="$emit('toggle-favorite')"
        :title="isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'"
      >
        <i :class="isFavorite ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
      </button>
    </div>

    <!-- SECCIÓN CENTRAL: Controles + Barra de progreso -->
    <div class="center-section d-flex flex-column align-items-center justify-content-center">
      <!-- Botones de Control -->
      <div class="player-controls d-flex align-items-center gap-3 mb-1">
        <button
          class="btn-control secondary"
          :class="{ active: isShuffling }"
          @click="$emit('toggle-shuffle')"
          title="Aleatorio"
        >
          <i class="bi bi-shuffle"></i>
        </button>

        <button
          class="btn-control"
          @click="$emit('prev')"
          title="Anterior"
        >
          <i class="bi bi-skip-start-fill"></i>
        </button>

        <button
          class="btn-play-pause"
          @click="$emit('toggle-play')"
          :title="isPlaying ? 'Pausa' : 'Reproducir'"
        >
          <i :class="isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill'"></i>
        </button>

        <button
          class="btn-control"
          @click="$emit('next')"
          title="Siguiente"
        >
          <i class="bi bi-skip-end-fill"></i>
        </button>

        <button
          class="btn-control secondary"
          :class="{ active: isRepeatActive }"
          @click="$emit('toggle-repeat')"
          title="Repetir"
        >
          <i class="bi bi-repeat"></i>
        </button>
      </div>

      <!-- Barra de progreso -->
      <div class="progress-bar-row d-flex align-items-center gap-2 w-100">
        <span class="time-label">{{ currentTimeFormatted }}</span>
        <div class="slider-container flex-grow-1">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            :value="progressValue"
            @input="onSeekInput"
            @mousedown="$emit('seek-start')"
            @mouseup="$emit('seek-end')"
            class="progress-slider"
          />
        </div>
        <span class="time-label">{{ durationFormatted }}</span>
      </div>
    </div>

    <!-- SECCIÓN DERECHA: Letras + PiP + Fullscreen + Volumen -->
    <div class="right-section d-flex align-items-center justify-content-end gap-2">
      <!-- Botón Letras -->
      <button
        class="btn-icon"
        :class="{ active: showLyrics }"
        @click="$emit('toggle-lyrics')"
        title="Letras"
      >
        <i class="bi bi-card-text"></i>
      </button>

      <!-- Botón Miniplayer Flotante (PiP) -->
      <button
        class="btn-icon"
        @click="$emit('open-miniplayer')"
        title="Modo flotante (Miniplayer)"
      >
        <i class="bi bi-pip"></i>
      </button>

      <!-- Botón Pantalla Completa -->
      <button
        class="btn-icon"
        @click="$emit('open-fullscreen')"
        title="Pantalla completa"
      >
        <i class="bi bi-arrows-angle-expand"></i>
      </button>

      <!-- Control de Volumen -->
      <div class="volume-container d-flex align-items-center gap-2 ms-2">
        <button class="btn-icon volume-btn" @click="toggleMute" :title="isMuted ? 'Activar sonido' : 'Silenciar'">
          <i :class="volumeIcon"></i>
        </button>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="currentVolume"
          @input="onVolumeInput"
          class="volume-slider"
          title="Volumen"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Track } from '@/stores/player-store'

const props = defineProps<{
  currentTrack: Track | null
  isPlaying: boolean
  isShuffling: boolean
  isRepeatActive: boolean
  progressValue: number
  currentTimeFormatted: string
  durationFormatted: string
  showLyrics: boolean
  isFavorite: boolean
  initialVolume?: number
}>()

const emit = defineEmits<{
  (e: 'toggle-play'): void
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'toggle-shuffle'): void
  (e: 'toggle-repeat'): void
  (e: 'seek', value: number): void
  (e: 'seek-start'): void
  (e: 'seek-end'): void
  (e: 'open-fullscreen'): void
  (e: 'open-miniplayer'): void
  (e: 'toggle-lyrics'): void
  (e: 'volume-change', value: number): void
  (e: 'toggle-favorite'): void
}>()

import { usePlayerStore } from '@/stores/player-store'

const playerStore = usePlayerStore()
const localVolume = ref(playerStore.volume)
const lastNonZeroVolume = ref(playerStore.volume || 100)

watch(() => playerStore.volume, (val) => {
  localVolume.value = val
  if (val > 0) lastNonZeroVolume.value = val
})

const currentVolume = computed(() => localVolume.value)
const isMuted = computed(() => localVolume.value === 0)

const volumeIcon = computed(() => {
  if (localVolume.value === 0) return 'bi bi-volume-mute-fill'
  if (localVolume.value < 40) return 'bi bi-volume-down-fill'
  return 'bi bi-volume-up-fill'
})

function onSeekInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('seek', parseFloat(target.value))
}

function onVolumeInput(event: Event) {
  const target = event.target as HTMLInputElement
  const val = parseInt(target.value, 10)
  localVolume.value = val
  if (val > 0) lastNonZeroVolume.value = val
  emit('volume-change', val)
}

function toggleMute() {
  if (localVolume.value > 0) {
    lastNonZeroVolume.value = localVolume.value
    localVolume.value = 0
    emit('volume-change', 0)
  } else {
    const restore = lastNonZeroVolume.value || 100
    localVolume.value = restore
    emit('volume-change', restore)
  }
}
</script>

<style scoped>
.bottom-player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 78px;
  background: var(--main-bg-color);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 99999;
  user-select: none;
  overflow: hidden;
  animation: slideUpBar 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUpBar {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* --- SECCIÓN IZQUIERDA --- */
.left-section {
  position: relative;
  z-index: 2;
  flex: 1;
  min-width: 200px;
  max-width: 320px;
}

.track-thumb-wrapper {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.track-thumb-wrapper:hover {
  transform: scale(1.04);
}

.track-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.track-thumb-placeholder {
  width: 100%;
  height: 100%;
  background: #222;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.thumb-hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 14px;
}

.track-thumb-wrapper:hover .thumb-hover-overlay {
  opacity: 1;
}

.track-info {
  min-width: 0;
}

.track-title {
  color: #ffffff;
  font-size: 0.88rem;
  line-height: 1.25;
  cursor: pointer;
  transition: color 0.2s ease;
}

.track-title:hover {
  color: var(--accent-color, #3e965d);
  text-decoration: underline;
}

.track-artist {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.76rem;
  line-height: 1.2;
}

/* --- BOTONES DE ICONO --- */
.btn-icon {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.65);
  font-size: 1.05rem;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  transform: scale(1.08);
}

.btn-icon.active {
  color: var(--accent-color, #3e965d);
}

.btn-like {
  color: rgba(255, 255, 255, 0.45);
}

.btn-like.is-favorite {
  color: #ef4444 !important;
}

.btn-like:hover {
  color: #ef4444;
}

/* --- SECCIÓN CENTRAL --- */
.center-section {
  position: relative;
  z-index: 2;
  flex: 2;
  max-width: 650px;
  min-width: 280px;
}

.btn-control {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-control:hover {
  color: #ffffff;
  transform: scale(1.1);
}

.btn-control.secondary {
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.45);
}

.btn-control.secondary:hover {
  color: #ffffff;
}

.btn-control.secondary.active {
  color: var(--accent-color, #3e965d);
}

.btn-play-pause {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ffffff;
  color: #0b0b0f;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}

.btn-play-pause:hover {
  transform: scale(1.08);
  background: #e6e6e6;
}

.btn-play-pause:active {
  transform: scale(0.96);
}

/* --- PROGRESS BAR --- */
.progress-bar-row {
  max-width: 580px;
}

.time-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.72rem;
  font-family: monospace;
  min-width: 36px;
  text-align: center;
}

.slider-container {
  display: flex;
  align-items: center;
}

.progress-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.progress-slider:hover {
  background: rgba(255, 255, 255, 0.3);
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  transition: transform 0.15s ease;
}

.progress-slider:hover::-webkit-slider-thumb {
  transform: scale(1.3);
  background: var(--accent-color, #3e965d);
}

/* --- SECCIÓN DERECHA --- */
.right-section {
  position: relative;
  z-index: 2;
  flex: 1;
  min-width: 200px;
  max-width: 320px;
}

.volume-container {
  width: 120px;
}

.volume-btn {
  font-size: 1rem;
}

.volume-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 78px;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.volume-slider:hover::-webkit-slider-thumb {
  transform: scale(1.3);
  background: var(--accent-color, #3e965d);
}

@media (max-width: 768px) {
  .left-section {
    min-width: 140px;
  }
  .track-artist {
    display: none;
  }
  .volume-container {
    display: none !important;
  }
}
</style>

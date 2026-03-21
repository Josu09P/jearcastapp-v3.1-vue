<template>
    <div class="mix-widget">
        <div class="mix-header">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h5 class="mix-title">
                        <i class="bi bi-stars me-2"></i> Mix para ti
                    </h5>
                    <p class="mix-subtitle">Basado en tus artistas favoritos</p>
                </div>
                <button @click="refreshMixes" class="refresh-mix-btn" :disabled="loading">
                    <i :class="['bi', loading ? 'bi-arrow-repeat spin-animation' : 'bi-arrow-clockwise']"></i>
                </button>
            </div>
        </div>

        <!-- Estado de carga -->
        <div v-if="loading" class="mix-loading">
            <div class="spinner-border text-light" role="status">
                <span class="visually-hidden">Analizando tus favoritos...</span>
            </div>
            <p class="mt-2">Analizando tus artistas favoritos...</p>
        </div>

        <!-- Grid de mixes -->
        <div v-else-if="mixes.length > 0" class="mix-grid">
            <div v-for="mix in mixes" :key="mix.id" class="mix-card" @click="playMix(mix)">
                <div class="mix-cover">
                    <img :src="mix.cover" :alt="mix.name">
                    <div class="mix-play-overlay">
                        <i class="bi bi-play-fill"></i>
                    </div>
                </div>
                <div class="mix-info">
                    <h6 class="mix-name">{{ mix.name }}</h6>
                    <p class="mix-desc">{{ mix.description }}</p>
                    <span class="mix-badge">
                        <i class="bi bi-music-note-beamed me-1"></i>
                        {{ mix.songs.length }} canciones
                    </span>
                </div>
            </div>
        </div>

        <!-- Estado vacío -->
        <div v-else class="mix-empty">
            <i class="bi bi-star"></i>
            <p>Agrega canciones a favoritos para generar mixes personalizados</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { generateArtistMixes } from '@/domain/usecases/mix/GenerateArtistMixesUseCase'
import type { MixModel } from '@/domain/models/MixModel'
import { useUserStore } from '@/stores/user'
import { usePlayerStore } from '@/stores/player-store'
import Toastify from 'toastify-js'

const userStore = useUserStore()
const playerStore = usePlayerStore()
const mixes = ref<MixModel[]>([])
const loading = ref(true)

const showToast = (text: string, isError: boolean = false) => {
    Toastify({
        text,
        duration: 3000,
        gravity: 'top',
        position: 'right',
        className: isError ? 'toast-glass bg-danger' : 'toast-glass'
    }).showToast()
}

const loadMixes = async () => {
    if (!userStore.id || !userStore.apikeyYoutube) {
        loading.value = false
        return
    }

    loading.value = true
    try {
        const generatedMixes = await generateArtistMixes(userStore.id, userStore.apikeyYoutube, 8)
        mixes.value = generatedMixes

        if (generatedMixes.length === 0) {
            showToast('Agrega más favoritos para obtener mixes personalizados', false)
        }
    } catch (error) {
        console.error('Error generando mixes:', error)
        showToast('Error al generar mixes', true)
    } finally {
        loading.value = false
    }
}

const refreshMixes = async () => {
    await loadMixes()
    showToast('Mixes actualizados')
}

const playMix = (mix: MixModel) => {
    if (!mix.songs || mix.songs.length === 0) {
        showToast('No hay canciones en este mix', true)
        return
    }

    const playlist = mix.songs.map(song => ({
        video_id: song.videoId,
        video_title: song.title,
        video_thumbnail: song.thumbnail
    }))

    playerStore.setPlaylist(playlist, 0)
    showToast(`🎵 Reproduciendo: ${mix.name}`)
}

onMounted(() => {
    loadMixes()
})

defineExpose({ refreshMixes })
</script>

<style scoped>
.mix-widget {
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.mix-header {
    margin-bottom: 1.5rem;
}

.mix-title {
    color: white;
    font-size: 1.2rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.mix-subtitle {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.85rem;
    margin: 0;
}

.refresh-mix-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.refresh-mix-btn:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
    transform: rotate(15deg);
}

.refresh-mix-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.mix-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.25rem;
}

.mix-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
}

.mix-card:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-4px);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.mix-cover {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
}

.mix-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.mix-card:hover .mix-cover img {
    transform: scale(1.05);
}

.mix-play-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    backdrop-filter: blur(2px);
}

.mix-card:hover .mix-play-overlay {
    opacity: 1;
}

.mix-play-overlay i {
    font-size: 3rem;
    color: white;
    transform: scale(0.8);
    transition: transform 0.2s ease;
}

.mix-card:hover .mix-play-overlay i {
    transform: scale(1);
}

.mix-info {
    padding: 0.75rem;
}

.mix-name {
    color: white;
    font-size: 0.95rem;
    font-weight: 500;
    margin: 0 0 0.25rem 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mix-desc {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.7rem;
    margin: 0 0 0.5rem 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mix-badge {
    display: inline-flex;
    align-items: center;
    font-size: 0.65rem;
    padding: 2px 8px;
    border-radius: 20px;
    background: rgba(29, 185, 84, 0.1);
    color: #1db954;
}

.mix-loading,
.mix-empty {
    text-align: center;
    padding: 2rem;
    color: rgba(255, 255, 255, 0.5);
}

.mix-empty i {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    opacity: 0.3;
}

.mix-empty p {
    font-size: 0.9rem;
    margin: 0;
}

.spin-animation {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .mix-widget {
        padding: 1rem;
        margin-bottom: 1.5rem;
    }

    .mix-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    .mix-name {
        font-size: 0.85rem;
    }
}

@media (max-width: 480px) {
    .mix-grid {
        grid-template-columns: 1fr;
    }

    .mix-header .d-flex {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
}
</style>
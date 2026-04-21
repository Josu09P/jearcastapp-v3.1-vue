<template>
    <div class="mix-widget">
        <div class="mix-header">
            <div class="d-flex justify-content-between align-items-center gap-2">
                <div class="container-title-home min-width-0" style="margin-top: -15px;">
                    <h4 class="text-white mb-0 fw-bold text-truncate">Mix para ti</h4>
                    <p class="mix-subtitle text-truncate">Basado en tus favoritos</p>
                </div>
                <div class="d-flex gap-2 align-items-center flex-shrink-0">
                    <span v-if="mixes.length > 0 && !loading" class="cached-badge" title="Guardado en caché">
                        <i class="bi bi-database"></i>
                    </span>
                    <button @click="refreshMixes" class="refresh-mix-btn" :disabled="loading">
                        <i :class="['bi', loading ? 'bi-arrow-repeat spin-animation' : 'bi-arrow-clockwise']"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Estado de carga -->
        <div v-if="loading" class="mix-loading">
            <div class="spinner-border text-light" role="status">
                <span class="visually-hidden">Analizando tus favoritos...</span>
            </div>
            <p class="mt-2">Analizando tus artistas favoritos...</p>
        </div>

        <!-- Grid de mixes - NUEVO DISEÑO HORIZONTAL -->
        <div v-else-if="mixes.length > 0" class="mix-list">
            <div v-for="mix in mixes" :key="mix.id" class="mix-item" @click="playMix(mix)">
                <div class="mix-item-cover">
                    <img :src="mix.cover" :alt="mix.name">
                    <div class="mix-item-overlay">
                        <i class="bi bi-play-fill"></i>
                    </div>
                </div>
                <div class="mix-item-info">
                    <h6 class="mix-item-name">{{ mix.name }}</h6>
                    <p class="mix-item-desc">{{ mix.description }}</p>
                    <div class="mix-item-meta">
                        <span class="mix-item-badge">
                            <i class="bi bi-music-note-beamed me-1"></i>
                            {{ mix.songs.length }} canciones
                        </span>
                    </div>
                </div>
                <div class="mix-item-action">
                    <button class="mix-play-button" @click.stop="playMix(mix)">
                        <i class="bi bi-play-circle-fill"></i>
                    </button>
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
import { generateDiscoveryMix } from '@/domain/usecases/mix/GenerateDiscoveryMixUseCase'
import type { MixModel } from '@/domain/models/MixModel'
import { useUserStore } from '@/stores/user'
import { usePlayerStore } from '@/stores/player-store'
import Toastify from 'toastify-js'
import { getFavoritesByUser } from '@/domain/usecases/favorites/GetFavoritesByUser'

const userStore = useUserStore()
const playerStore = usePlayerStore()
const mixes = ref<MixModel[]>([])
const loading = ref(true)
const favoritesHash = ref('')
const initialized = ref(false)
const MAX_MIXES = 4

const showToast = (text: string, isError: boolean = false) => {
    Toastify({
        text,
        duration: 3000,
        gravity: 'top',
        position: 'right',
        className: isError ? 'toast-glass bg-danger' : 'toast-glass'
    }).showToast()
}

// Generar hash único de los favoritos
const generateFavoritesHash = async (): Promise<string> => {
    try {
        if (!userStore.id) return ''
        const response = await getFavoritesByUser(userStore.id)
        const favorites = Array.isArray(response) ? response : (response as any).favorites || []
        const hash = favorites.map((f: any) => f.video_id).sort().join(',')
        return hash
    } catch (error) {
        console.error('Error generando hash:', error)
        return ''
    }
}

// Cargar mixes desde localStorage
const loadMixesFromCache = (): MixModel[] | null => {
    try {
        const cached = localStorage.getItem('cachedMixes')
        const cachedHash = localStorage.getItem('cachedMixesHash')

        if (cached && cachedHash && cachedHash === favoritesHash.value) {
            return JSON.parse(cached)
        }
        return null
    } catch (error) {
        console.error('Error cargando caché:', error)
        return null
    }
}

// Guardar mixes en localStorage
const saveMixesToCache = (mixesData: MixModel[]) => {
    try {
        localStorage.setItem('cachedMixes', JSON.stringify(mixesData))
        localStorage.setItem('cachedMixesHash', favoritesHash.value)
    } catch (error) {
        console.error('Error guardando caché:', error)
    }
}

// Limpiar caché
const clearCache = () => {
    localStorage.removeItem('cachedMixes')
    localStorage.removeItem('cachedMixesHash')
}

// Cargar mixes
const loadMixes = async (forceRefresh: boolean = false) => {
    if (!userStore.id) {
        loading.value = false
        return
    }

    loading.value = true

    try {
        favoritesHash.value = await generateFavoritesHash()

        if (!forceRefresh) {
            const cached = loadMixesFromCache()
            if (cached && cached.length > 0) {
                console.log('Usando mixes cacheados')
                mixes.value = cached
                loading.value = false
                return
            }
        }

        console.log('Generando nuevos mixes...')
        
        // 1. Generar Mix de Descubrimiento (SCRAPING - Basado en historial reciente)
        const discoveryMix = await generateDiscoveryMix()
        
        // 2. Generar Mixes por Artista (SCRAPING - Basado en favoritos)
        const generatedMixes = await generateArtistMixes(userStore.id, MAX_MIXES)
        
        // Combinar (Discovery siempre primero si existe)
        const finalMixes = discoveryMix ? [discoveryMix, ...generatedMixes] : generatedMixes
        mixes.value = finalMixes

        if (finalMixes.length > 0) {
            saveMixesToCache(finalMixes)
        }

        if (finalMixes.length === 0) {
            showToast('Escucha algunas canciones para generar mixes personalizados')
        }
    } catch (error) {
        console.error('Error generando mixes:', error)
        showToast('Error al generar mixes', true)
        clearCache()
    } finally {
        loading.value = false
    }
}

const refreshMixes = async () => {
    clearCache()
    await loadMixes(true)
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
    showToast(`Reproduciendo: ${mix.name}`)
}

onMounted(async () => {
    if (!initialized.value && userStore.id) {
        await loadMixes()
        initialized.value = true
    }
})

defineExpose({ refreshMixes, loadMixes })
</script>

<style scoped>
.mix-widget {
    border-radius: 16px;
    padding: 1rem;
    margin-bottom: 2rem;
}

.cached-badge {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.3);
    cursor: help;
}

.mix-header {
    margin-bottom: 1.5rem;
}

.container-title-home h4 {
    font-size: 21px;
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

/* NUEVO DISEÑO - LISTA HORIZONTAL */
.mix-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.mix-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.mix-item:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateX(4px);
}

.mix-item-cover {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
    background: rgba(0, 0, 0, 0.3);
}

.mix-item-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.mix-item:hover .mix-item-cover img {
    transform: scale(1.05);
}

.mix-item-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    backdrop-filter: blur(2px);
}

.mix-item:hover .mix-item-overlay {
    opacity: 1;
}

.mix-item-overlay i {
    font-size: 1.5rem;
    color: var(--accent-color) !important;
}

.mix-item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.mix-item-name {
    color: white;
    font-size: 0.9rem;
    font-weight: 500;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mix-item-desc {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.7rem;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mix-item-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
}

.mix-item-badge {
    display: inline-flex;
    align-items: center;
    font-size: 0.6rem;
    padding: 2px 8px;
    border-radius: 20px;
    background: rgba(29, 185, 84, 0.1);
    color: var(--accent-color);
    width: fit-content;
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

.mix-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.mix-item-action {
    flex-shrink: 0;
    margin-left: auto;
}

.mix-play-button {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    font-size: 1.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mix-play-button:hover {
    color: var(--accent-color);
    transform: scale(1.1);
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
        padding: 0.75rem;
    }

    .mix-item {
        padding: 0.5rem;
        gap: 0.75rem;
    }

    .mix-item-cover {
        width: 50px;
        height: 50px;
    }

    .mix-item-name {
        font-size: 0.85rem;
    }

    .mix-item-desc {
        font-size: 0.65rem;
    }
}

@media (max-width: 480px) {
    .mix-item {
        padding: 0.5rem;
    }

    .mix-item-cover {
        width: 45px;
        height: 45px;
    }

    .mix-item-name {
        font-size: 0.8rem;
    }
}
</style>
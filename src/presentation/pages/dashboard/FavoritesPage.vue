<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'
import { useUserDataStore } from '@/stores/userDataStore'
import { removeFavoriteMusic } from '@/domain/usecases/favorites/RemoveFavoriteMusic'
import Toastify from 'toastify-js'
import { usePlayerStore } from '@/stores/player-store'
import DownloadButton from '@/presentation/widgets/DownloadButton.vue'

const userDataStore = useUserDataStore()
const playerStore = usePlayerStore()
const sortOption = ref<'recent' | 'alphabetical'>('recent')
const deletingMap = ref<Record<string, boolean>>({})

// Lógica para fondo dinámico del Hero
const currentBgIndex = ref(0)
const bgImages = computed(() => {
    // Tomar miniaturas de los favoritos para el fondo
    const images = favorites.value.map(f => f.video_thumbnail).filter(img => !!img)
    return images.length > 0 ? images : []
})

const currentBgImage = computed(() => {
    if (bgImages.value.length === 0) return ''
    return bgImages.value[currentBgIndex.value]
})

let bgInterval: any = null
const startBgRotation = () => {
    if (bgInterval) clearInterval(bgInterval)
    bgInterval = setInterval(() => {
        if (bgImages.value.length > 1) {
            currentBgIndex.value = (currentBgIndex.value + 1) % bgImages.value.length
        }
    }, 5000) // Cambia cada 5 segundos
}

// Usar datos del store
const favorites = computed(() => userDataStore.favorites)
const loading = computed(() => userDataStore.loading.favorites)

// --- Optimización de Renderizado (Lazy Loading) ---
const displayLimit = ref(20)
const visibleFavorites = computed(() => {
    return sortedFavorites.value.slice(0, displayLimit.value)
})

const loadMore = (entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && displayLimit.value < favorites.value.length) {
        displayLimit.value += 20
    }
}

let observer: IntersectionObserver | null = null
const setupObserver = () => {
    const sentinel = document.getElementById('favorites-sentinel')
    if (sentinel) {
        observer = new IntersectionObserver(loadMore, { threshold: 0.1 })
        observer.observe(sentinel)
    }
}
// --------------------------------------------------

// Ordenar favoritos
const sortedFavorites = computed(() => {
    if (sortOption.value === 'recent') {
        return [...favorites.value].sort((a, b) => {
            return (b.created_at?.toDate()?.getTime() || 0) - (a.created_at?.toDate()?.getTime() || 0)
        })
    } else {
        return [...favorites.value].sort((a, b) => {
            return a.video_title.localeCompare(b.video_title)
        })
    }
})

async function removeFavorite(videoId: string) {
    const userId = userDataStore.getUserId()
    if (!userId) return

    deletingMap.value[videoId] = true
    Toastify({
        text: 'Eliminando...',
        duration: 1500,
        className: 'toast-glass',
        gravity: 'top',
        position: 'right',
    }).showToast()

    try {
        await removeFavoriteMusic({ user_id: userId, video_id: videoId })

        // Invalidar y recargar favoritos
        await userDataStore.invalidateAndRefreshFavorites()

        Toastify({
            text: 'Eliminado de favoritos',
            duration: 1500,
            className: 'toast-glass',
            gravity: 'top',
            position: 'right',
        }).showToast()
    } catch (e) {
        Toastify({
            text: 'Error al eliminar favorito',
            duration: 1500,
            className: 'toast-glass',
            gravity: 'top',
            position: 'right',
        }).showToast()
        console.error(e)
    } finally {
        deletingMap.value[videoId] = false
    }
}

function playFavorite(index: number) {
    const playlist = sortedFavorites.value.map((fav) => ({
        video_id: fav.video_id,
        video_title: fav.video_title,
        video_thumbnail: fav.video_thumbnail,
    }))
    playerStore.setPlaylist(
        playlist,
        index,
        { type: 'favorites' },
        userDataStore.hasMoreFavorites
    )
}

function toggleSortOption() {
    sortOption.value = sortOption.value === 'recent' ? 'alphabetical' : 'recent'
}

async function refreshFavorites() {
    await userDataStore.invalidateAndRefreshFavorites()
    Toastify({
        text: 'Favoritos actualizados',
        duration: 1500,
        className: 'toast-glass',
        gravity: 'top',
        position: 'right',
    }).showToast()
}

function playAll() {
    if (sortedFavorites.value.length > 0) {
        playFavorite(0)
    }
}

// CARGADO YA EN LAYOUT PRINCIPAL
onMounted(() => {
    startBgRotation()
    setupObserver() // Inicializar el scroll infinito
    console.log('Favoritos: usando datos del store (sin petición)')
})

onUnmounted(() => {
    if (bgInterval) clearInterval(bgInterval)
    if (observer) observer.disconnect() // Desconectar observador al salir
})
</script>

<template>
    <DashboardLayout>
        <div class="container-fluid px-0">
            <!-- HERO SECTION CON FONDO DINÁMICO DE FAVORITOS -->
            <div class="favorites-hero mb-4" :style="{ backgroundImage: `url(${currentBgImage})` }">
                <div class="hero-overlay">
                    <div class="hero-content px-4">
                        <span class="badge bg-accent mb-2">Tu Colección</span>
                        <h1 class="display-4 fw-bold text-white mb-2">Favoritos</h1>
                        <div class="d-flex align-items-center gap-3 text-white-50">
                            <span><i class="bi bi-heart-fill me-1 text-white"></i> {{ favorites.length }}
                                Canciones</span>
                        </div>
                        <div class="mt-4 d-flex gap-2">
                            <button @click="playAll" class="btn btn-accent rounded-pill px-4 py-2 fw-semibold">
                                <i class="bi bi-play-fill me-1"></i> Reproducir todo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-4 px-3">
                <h4 class="text-white mb-0 fw-bold d-none d-sm-block" style="font-size: 1.1rem !important;">Lista de
                    Favoritos</h4>
                <div class="d-flex gap-2 ms-auto ms-sm-0 w-100 w-sm-auto justify-content-center justify-content-sm-end">
                    <button @click="toggleSortOption"
                        class="btn btn-dark btn-sm rounded-pill px-3 filter-button-favorites">
                        <i :class="sortOption === 'recent' ? 'bi bi-clock-history' : 'bi bi-sort-alpha-down'"
                            class="me-1" />
                        {{ sortOption === 'recent' ? 'Recientes' : 'A-Z' }}
                    </button>
                    <button @click="refreshFavorites" :disabled="loading"
                        class="btn btn-outline-light btn-sm rounded-pill px-3 refresh-button-favorites"
                        title="Refrescar Favoritos" style="border: 1px solid rgba(255, 255, 255, 0.08);">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-arrow-clockwise"></i>
                    </button>
                    <span v-if="!loading && favorites.length > 0" class="cached-badge" title="Datos en caché">
                        <i class="bi bi-database"></i>
                    </span>
                </div>
            </div>

            <div class="row px-3 py-2 text-secondary d-none d-md-flex mb-2 border-bottom border-white border-opacity-10"
                style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">
                <div class="col-1 text-center">#</div>
                <div class="col-6">Título</div>
                <div class="col-3 text-center">Agregado el</div>
                <div class="col-2 text-center">Acciones</div>
            </div>

            <div class="px-0">
                <div v-for="(fav, index) in visibleFavorites" :key="fav.id"
                    class="song-row row align-items-center p-2 mx-0 mb-1" @dblclick="playFavorite(index)">

                    <div class="col-1 d-none d-sm-flex text-secondary index-col text-center">
                        <span class="number">{{ index + 1 }}</span>
                        <i class="bi bi-play-fill play-icon text-white" @click="playFavorite(index)"
                            title="Reproducir"></i>
                    </div>

                    <div class="col-9 col-sm-8 col-md-6 d-flex align-items-center gap-2 gap-sm-3">
                        <img :src="fav.video_thumbnail" class="rounded shadow-sm flex-shrink-0"
                            style="width: 44px; height: 44px; object-fit: cover" />
                        <div class="text-truncate">
                            <h6 class="text-white mb-0 text-truncate fw-semibold"
                                style="font-size: 0.85rem; font-size: 0.9rem;">{{
                                    fav.video_title }}</h6>
                            <small class="text-secondary d-none d-sm-block" style="font-size: 11px;">JearCast
                                Music</small>
                        </div>
                    </div>

                    <div class="col-3 d-none d-md-block text-secondary small text-center font-monospace">
                        {{ fav.created_at?.toDate().toLocaleDateString() }}
                    </div>

                    <!-- En lugar del botón simple, usa el componente -->
                    <div
                        class="col-3 col-sm-3 col-md-2 d-flex justify-content-end justify-content-md-center align-items-center gap-1">
                        <button @click="removeFavorite(fav.video_id)" class="btn btn-link p-0 remove-btn"
                            title="Eliminar de favoritos">
                            <span v-if="deletingMap[fav.video_id]"
                                class="spinner-border spinner-border-sm text-secondary"></span>
                            <i v-else class="bi bi-heart-fill text-secondary"
                                style="font-size: 1.12rem !important;"></i>
                        </button>

                        <DownloadButton :video-id="fav.video_id" :title="fav.video_title"
                            :thumbnail="fav.video_thumbnail" />
                    </div>
                </div>

                <!-- Centinela para scroll infinito -->
                <div id="favorites-sentinel" style="height: 20px;"></div>

                <!-- Botón Cargar Más de Firebase -->
                <div v-if="userDataStore.hasMoreFavorites" class="text-center py-4">
                    <button @click="userDataStore.loadMoreFavorites()" :disabled="loading"
                        class="btn btn-outline-light rounded-pill px-5 btn-load-more">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-plus-circle me-2"></i>
                        Cargar más favoritos
                    </button>
                </div>
            </div>
        </div>
    </DashboardLayout>
</template>

<style scoped>
@import url('@/assets/css/playlist-styles.css');

.btn-load-more {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

.btn-load-more:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--accent-color);
    color: var(--accent-color);
    transform: translateY(-2px);
}

.favorites-hero {
    height: 300px;
    background-size: cover;
    background-position: center;
    position: relative;
    border-bottom-left-radius: 1rem;
    border-bottom-right-radius: 1rem;
    overflow: hidden;
    margin-top: -1.5rem;
    transition: background-image 1s ease-in-out;
    transform: translateZ(0);
}

.favorites-hero::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: inherit;
    background-size: inherit;
    background-position: inherit;
    filter: blur(15px);
    transform: scale(1.1);
    z-index: 0;
    /* Radio mucho más grande para que el blur cubra el borde del contenedor */
    border-bottom-left-radius: 4rem;
    border-bottom-right-radius: 4rem;
}

.hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.8) 100%);
    display: flex;
    align-items: flex-end;
    padding-bottom: 2rem;
    z-index: 1;
}

.bg-accent {
    background-color: var(--accent-color) !important;
}

.btn-accent {
    background-color: var(--accent-color);
    color: white;
    border: 1px solid var(--accent-color);
    transition: all 0.3s ease;
}

.btn-accent:hover {
    background-color: transparent;
    color: var(--accent-color);
    border-color: var(--accent-color);
    transform: translateY(-2px);
}

.filter-button-favorites {
    transition: background-color 0.3s, color 0.3s;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
}

.refresh-button-favorites {
    transition: background-color 0.3s, color 0.3s;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
}

.cached-badge {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
    display: flex;
    align-items: center;
    cursor: help;
    background: rgba(255, 255, 255, 0.05);
    padding: 0 8px;
    border-radius: 20px;
}

/* Estilos de canción (reutilizados) */
.song-row {
    border-radius: 0.5rem;
    transition: background-color 0.2s ease;
    cursor: pointer;
}

.song-row:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

.index-col {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.index-col .number {
    display: inline-block;
}

.index-col .play-icon {
    display: none;
    position: absolute;
    font-size: 1.1rem;
    cursor: pointer;
}

.song-row:hover .index-col .number {
    display: none;
}

.song-row:hover .index-col .play-icon {
    display: inline-block;
}

.remove-btn {
    color: rgba(255, 255, 255, 0.5);
    transition: color 0.2s ease;
    background: none;
    border: none;
}

.remove-btn:hover {
    color: #dc3545 !important;
}
</style>
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
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

const loadMore = async (entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting) {
        // 1. Primero agotamos lo que ya tenemos cargado en memoria (displayLimit)
        if (displayLimit.value < favorites.value.length) {
            displayLimit.value += 20
        } 
        // 2. Si ya mostramos todo lo de memoria, pero hay más en Firebase, cargamos más
        else if (userDataStore.hasMoreFavorites && !loading.value) {
            console.log('Cargando más favoritos automáticamente por scroll...')
            await userDataStore.loadMoreFavorites()
            // Al cargarse más en favorites.value, el primer punto volverá a ser cierto
            displayLimit.value += 20 
        }
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

// ==================== BÚSQUEDA EN BASE DE DATOS ====================
const isSearchOpen = ref(false)
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const isSearchingDb = ref(false)
const isSearchActive = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
let searchDebounceTimer: any = null

const toggleSearch = () => {
    isSearchOpen.value = !isSearchOpen.value
    if (isSearchOpen.value) {
        nextTick(() => {
            searchInputRef.value?.focus()
        })
    } else {
        clearSearch()
    }
}

const onSearchInput = () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
    const term = searchQuery.value.trim()
    if (!term) {
        isSearchActive.value = false
        searchResults.value = []
        isSearchingDb.value = false
        return
    }

    isSearchingDb.value = true
    searchDebounceTimer = setTimeout(async () => {
        try {
            const results = await userDataStore.searchFavoritesInDb(term)
            searchResults.value = results
            isSearchActive.value = true
        } catch (e) {
            console.error('Error buscando favoritos en BD:', e)
            Toastify({
                text: 'Error consultando base de datos',
                duration: 2000,
                className: 'toast-glass bg-danger',
                gravity: 'top',
                position: 'right'
            }).showToast()
        } finally {
            isSearchingDb.value = false
        }
    }, 350)
}

const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    isSearchActive.value = false
    isSearchingDb.value = false
}

const displayedFavorites = computed(() => {
    if (isSearchActive.value) {
        if (sortOption.value === 'recent') {
            return [...searchResults.value].sort((a, b) => {
                return (b.created_at?.toDate?.()?.getTime?.() || 0) - (a.created_at?.toDate?.()?.getTime?.() || 0)
            })
        } else {
            return [...searchResults.value].sort((a, b) => {
                return (a.video_title || '').localeCompare(b.video_title || '')
            })
        }
    }
    return visibleFavorites.value
})

function playFavorite(index: number) {
    const listToPlay = isSearchActive.value ? displayedFavorites.value : sortedFavorites.value
    const playlist = listToPlay.map((fav) => ({
        video_id: fav.video_id,
        video_title: fav.video_title,
        video_thumbnail: fav.video_thumbnail,
    }))
    playerStore.setPlaylist(
        playlist,
        index,
        { type: 'favorites' },
        isSearchActive.value ? false : userDataStore.hasMoreFavorites
    )
}

function toggleSortOption() {
    sortOption.value = sortOption.value === 'recent' ? 'alphabetical' : 'recent'
}

async function refreshFavorites() {
    await userDataStore.invalidateAndRefreshFavorites()
    if (isSearchActive.value && searchQuery.value) {
        onSearchInput()
    }
    Toastify({
        text: 'Favoritos actualizados',
        duration: 1500,
        className: 'toast-glass',
        gravity: 'top',
        position: 'right',
    }).showToast()
}

function playAll() {
    if (displayedFavorites.value.length > 0) {
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
            <div class="favorites-hero mb-4">
                <div class="hero-bg-layer" :style="{ backgroundImage: `url(${currentBgImage})` }"></div>
                <div class="hero-overlay">
                    <div class="hero-content px-4">
                        <!--<span class="badge bg-accent mb-2">Tu Colección</span>-->
                        <h1 class="display-4 fw-bold text-white mb-2">Favoritos</h1>
                        <div class="d-flex align-items-center gap-3 text-white-50">
                            <span><i class="bi bi-heart-fill me-1 text-white"></i> {{ userDataStore.favoritesTotalCount }}
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

            <div class="d-flex justify-content-between align-items-center mb-4 px-3 flex-wrap gap-2">
                <h4 class="text-white mb-0 fw-bold d-none d-sm-block" style="font-size: 1.1rem !important;">Lista de
                    Favoritos</h4>
                <div class="d-flex gap-2 ms-auto ms-sm-0 w-100 w-sm-auto justify-content-center justify-content-sm-end align-items-center">
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
                    <!-- BOTÓN DE BÚSQUEDA EN BASE DE DATOS DE FAVORITOS -->
                    <button @click="toggleSearch"
                        class="btn btn-outline-light btn-sm rounded-pill px-3 search-button-favorites"
                        :class="{ 'active-search': isSearchOpen }"
                        title="Buscar en mis favoritos (Base de datos)" style="border: 1px solid rgba(255, 255, 255, 0.08);">
                        <i class="bi bi-search"></i>
                    </button>
                    <span v-if="!loading && favorites.length > 0" class="cached-badge" title="Datos en caché">
                        <i class="bi bi-database"></i>
                    </span>
                </div>
            </div>

            <!-- BARRA DE BÚSQUEDA EN BASE DE DATOS PARA FAVORITOS -->
            <div v-if="isSearchOpen" class="px-3 mb-4 favorites-db-search-bar">
                <div class="position-relative d-flex align-items-center">
                    <i class="bi bi-search position-absolute start-0 ms-3 text-secondary"></i>
                    <input 
                        ref="searchInputRef"
                        v-model="searchQuery" 
                        @input="onSearchInput"
                        @keydown.esc="clearSearch"
                        type="text" 
                        class="form-control rounded-pill ps-5 pe-5 py-2 favorites-search-input" 
                        placeholder="Buscar canción en tus favoritos (consulta a base de datos)..."
                    />
                    <div class="position-absolute end-0 me-3 d-flex align-items-center gap-2">
                        <span v-if="isSearchingDb" class="spinner-border spinner-border-sm text-accent"></span>
                        <button v-if="searchQuery" @click="clearSearch" class="btn btn-link text-secondary p-0 text-decoration-none" title="Limpiar búsqueda">
                            <i class="bi bi-x-circle-fill fs-5 text-white-50"></i>
                        </button>
                    </div>
                </div>
                <div v-if="isSearchActive" class="d-flex align-items-center justify-content-between px-2 pt-2 text-secondary small">
                    <span>
                        <i class="bi bi-database-check me-1" style="color: var(--accent-color, #1db954);"></i>
                        Base de datos: <strong class="text-white">{{ searchResults.length }}</strong> canción(es) encontrada(s)
                    </span>
                    <button @click="clearSearch" class="btn btn-sm btn-link text-white-50 p-0 text-decoration-none">
                        Restaurar todos
                    </button>
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
                <div v-for="(fav, index) in displayedFavorites" :key="fav.id"
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
                        {{ fav.created_at?.toDate?.() ? fav.created_at.toDate().toLocaleDateString() : 'Reciente' }}
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

                <!-- Estado vacío de búsqueda -->
                <div v-if="isSearchActive && displayedFavorites.length === 0" class="text-center py-5">
                    <i class="bi bi-search text-secondary display-4 d-block mb-3"></i>
                    <h5 class="text-white">Sin coincidencias en tu base de datos</h5>
                    <p class="text-secondary small">No se encontró ninguna canción en tus favoritos que contenga "{{ searchQuery }}"</p>
                    <button @click="clearSearch" class="btn btn-outline-light btn-sm rounded-pill px-4 mt-2">
                        Ver todas mis canciones
                    </button>
                </div>

                <!-- Centinela para scroll infinito -->
                <div v-if="!isSearchActive" id="favorites-sentinel" style="height: 20px;"></div>

                <!-- Botón Cargar Más de Firebase -->
                <div v-if="userDataStore.hasMoreFavorites && !isSearchActive" class="text-center py-4">
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

.favorites-db-search-bar {
    max-width: 640px;
    animation: fadeInSearchBar 0.25s ease-out;
}

@keyframes fadeInSearchBar {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
}

.favorites-search-input {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #ffffff;
    font-size: 0.9rem;
    backdrop-filter: blur(12px);
    transition: all 0.25s ease;
}

.favorites-search-input:focus {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--accent-color, #1db954);
    box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb, 29, 185, 84), 0.25);
    color: #ffffff;
}

.favorites-search-input::placeholder {
    color: rgba(255, 255, 255, 0.45);
}

.search-button-favorites.active-search {
    background: var(--accent-color, #1db954) !important;
    border-color: var(--accent-color, #1db954) !important;
    color: #ffffff !important;
}

.favorites-hero {
    height: 280px;
    position: relative;
    overflow: hidden;
    margin-top: -1.5rem;
    transform: translateZ(0);
    mask-image: linear-gradient(to bottom, black 0%, black 65%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, black 0%, black 65%, transparent 100%);
}

.hero-bg-layer {
    position: absolute;
    inset: -12px;
    background-size: cover;
    background-position: center;
    transition: background-image 1s ease-in-out;
    filter: blur(14px);
    transform: scale(1.06);
    mask-image: linear-gradient(to bottom, black 25%, rgba(0, 0, 0, 0.45) 55%, transparent 92%);
    -webkit-mask-image: linear-gradient(to bottom, black 25%, rgba(0, 0, 0, 0.45) 55%, transparent 92%);
    z-index: 0;
}

.hero-overlay {
    position: relative;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.45) 50%, rgba(15, 15, 15, 0.95) 85%, transparent 100%);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    padding-top: 1rem;
    z-index: 1;
}

.hero-overlay::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: 
        linear-gradient(to bottom, transparent 30%, rgba(15, 15, 15, 0.85) 75%, transparent 100%),
        linear-gradient(to right, rgba(15, 15, 15, 0.8) 0%, transparent 12%, transparent 88%, rgba(15, 15, 15, 0.8) 100%);
    z-index: 1;
}

.hero-content {
    position: relative;
    z-index: 3;
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
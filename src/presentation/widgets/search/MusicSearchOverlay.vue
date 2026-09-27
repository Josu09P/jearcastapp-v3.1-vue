<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { getVideoStats } from '@/data/services/youtube/GetVideoStats'
import { searchYoutube } from '@/data/services/youtube/SearchYoutube'
import { addFavoriteMusic } from '@/domain/usecases/favorites/AddFavoriteMusic'
import { usePlayerStore } from '@/stores/player-store'
import { useUserStore } from '@/stores/user'
import Toastify from 'toastify-js'
import { getPlaylistsByUser } from '@/domain/usecases/playlists/GetPlaylistsByUser'
import type { PlaylistModel } from '@/domain/models/PlayListModel'
import { songExistsInPlaylist } from '@/domain/usecases/playlists/SongExistsInPlaylist'
import { addSongToPlaylistService } from '@/data/services/firestore/PlaylistsFirestore'
import { createOrGetPlaylist } from '@/domain/usecases/playlists/CreateOrGetPlaylist'
import { useApiKeyManager } from '@/composables/useApiKeyManager'

import { youtubeScraperService } from '@/data/services/youtube/YouTubeScraperService'

const query = ref('')
const results = ref<any[]>([])
const searchPerformed = ref(false)
const props = defineProps<{ visible: boolean }>()
const addingFavoritesMap = ref<Record<string, boolean>>({})
const isProcessing = ref(false)
const searching = ref(false)
const isUsingScraper = ref(false)
const emit = defineEmits<{
    (e: 'close'): void
    (e: 'openPlaylistModal', video: any): void
}>()
const close = () => emit('close')
const loadingPlaylists = ref(false)
const userStore = useUserStore()
const playerStore = usePlayerStore()
const playlists = ref<PlaylistModel[]>([])
const selectedPlaylistId = ref('')
const newPlaylistName = ref('')
const showPlaylistModal = ref(false)
const selectedVideo = ref<any | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const isDropdownOpen = ref(false)

const selectedPlaylistName = computed(() => {
    const pl = playlists.value.find(p => p.id === selectedPlaylistId.value)
    return pl ? pl.name : ''
})

const selectPlaylist = (playlist: PlaylistModel) => {
    selectedPlaylistId.value = playlist.id
    isDropdownOpen.value = false
}

const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value
}

const handleModalClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('.custom-glass-dropdown')) {
        isDropdownOpen.value = false
    }
}

// Método para enfocar el input
const focusInput = () => {
    setTimeout(() => {
        if (inputRef.value) {
            inputRef.value.focus()
        }
    }, 50)
}

defineExpose({
    focusInput
})

// ==================== USAR EL API KEY MANAGER ====================
const apiKeyManager = useApiKeyManager()

// Usar las variables reactivas del manager directamente en el template
const apiKeys = computed(() => apiKeyManager.apiKeys.value)
const currentApiKeyIndex = computed(() => apiKeyManager.currentApiKeyIndex.value)
const quotaExceeded = computed(() => apiKeyManager.quotaExceeded.value)

const onSearch = async () => {
    if (!query.value) return

    searching.value = true
    searchPerformed.value = true
    results.value = []
    isUsingScraper.value = false

    try {
        // Intento 1: Usar API Keys con el Manager (si existen)
        if (apiKeys.value.length > 0 && currentApiKeyIndex.value !== -1) {
            console.log('Buscador: Intentando búsqueda oficial con API Key')
            try {
                const apiResults = await apiKeyManager.executeWithFailover(async (key) => {
                    const videos = await searchYoutube(query.value, key)
                    if (!videos || !Array.isArray(videos)) return []
                    const stats = await getVideoStats(videos.map((v: any) => v.videoId).join(','), key)
                    return videos.map((v: any) => {
                        const stat = Array.isArray(stats) ? stats.find((s: any) => s.videoId === v.videoId) : null
                        return {
                            ...v,
                            viewCount: stat?.viewCount || 0
                        }
                    })
                })
                if (apiResults && Array.isArray(apiResults) && apiResults.length > 0) {
                    results.value = apiResults
                }
            } catch (apiErr) {
                console.warn('Fallo en búsqueda oficial con API key, pasando a scraper:', apiErr)
            }
        }

        // Intento 2: Si no hay resultados (o no hay Keys / quota agotada), usar Scraper (yt-dlp backend)
        if (!results.value || results.value.length === 0) {
            console.log('Buscador: Usando Scraper (yt-dlp)')
            isUsingScraper.value = true
            const scraperResults = await youtubeScraperService.searchWithoutToken(query.value)
            if (scraperResults && Array.isArray(scraperResults)) {
                results.value = scraperResults.map((v: any) => ({
                    videoId: v.videoId,
                    title: v.title,
                    thumbnail: v.thumbnail,
                    author: v.author,
                    duration: v.duration || '',
                    views: v.views || '',
                    url: v.url || `https://youtube.com/watch?v=${v.videoId}`
                }))
            } else {
                results.value = []
            }
        }

        if (!results.value || results.value.length === 0) {
            showToast('No se encontraron resultados')
        }
    } catch (error: any) {
        console.error('Error en búsqueda:', error)
        showToast(error.message || 'Error al buscar')
    } finally {
        searching.value = false
    }
}

// Inicializar el manager al montar el componente
onMounted(async () => {
    if (!userStore.id) return
    await apiKeyManager.initialize()
    playlists.value = await getPlaylistsByUser(userStore.id)
})

// Cuando se abre el buscador, asegurar que el manager esté inicializado
watch(() => props.visible, async (newVal) => {
    if (newVal && userStore.id && apiKeyManager.currentApiKeyIndex.value === -1) {
        await apiKeyManager.initialize()
    }
})

// ==================== FIN API KEY MANAGER ====================

const showToast = (text: string) => {
    Toastify({
        text,
        duration: 2000,
        gravity: 'top',
        position: 'right',
        className: 'toast-glass'
    }).showToast()
}

const refreshPlaylists = async () => {
    if (!userStore.id) return
    loadingPlaylists.value = true
    playlists.value = await getPlaylistsByUser(userStore.id)
    showToast('Playlists actualizadas')
    setTimeout(() => {
        loadingPlaylists.value = false
    }, 1000)
}

const playVideo = (index: number) => {
    const playlist = results.value.map((video: any) => ({
        video_id: video.videoId,
        video_title: video.title,
        video_thumbnail: video.thumbnail
    }))

    const currentVideo = playlist[index]
    saveToRecentlyPlayed(currentVideo)
    playerStore.setPlaylist(playlist, index)
}

const saveToRecentlyPlayed = (video: any) => {
    const key = 'recentlyPlayed'
    const maxItems = 20
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const filtered = existing.filter((v: any) => v.video_id !== video.video_id)
    filtered.unshift(video)
    const limited = filtered.slice(0, maxItems)
    localStorage.setItem(key, JSON.stringify(limited))
}

const addToFavorites = async (video: any) => {
    if (!userStore.id || addingFavoritesMap.value[video.videoId]) return

    addingFavoritesMap.value[video.videoId] = true
    const result = await addFavoriteMusic({
        user_id: userStore.id,
        video_id: video.videoId,
        video_title: video.title,
        video_thumbnail: video.thumbnail
    })

    Toastify({
        text: result === 'exists' ? 'Ya está en favoritos' : 'Agregado a favoritos',
        duration: 2000,
        gravity: 'top',
        position: 'right',
        className: 'toast-glass'
    }).showToast()

    addingFavoritesMap.value[video.videoId] = false
}

const openPlaylistModal = (video: any) => {
    selectedVideo.value = video
    isDropdownOpen.value = false
    showPlaylistModal.value = true
}

const addToPlaylist = async () => {
    if (isProcessing.value) return
    if (!userStore.id || !selectedVideo.value || !selectedPlaylistId.value) {
        return showToast('Faltan datos para agregar a la playlist')
    }

    isProcessing.value = true
    showToast('Añadiendo a la playlist...')

    try {
        const exists = await songExistsInPlaylist(selectedPlaylistId.value, selectedVideo.value.videoId)
        if (exists) {
            return showToast('La canción ya está en esta playlist')
        }

        await addSongToPlaylistService(selectedPlaylistId.value, {
            video_id: selectedVideo.value.videoId,
            video_title: selectedVideo.value.title,
            video_thumbnail: selectedVideo.value.thumbnail
        })

        showToast('Agregado a la playlist')
        showPlaylistModal.value = false
    } catch (error) {
        showToast('Error al agregar a la playlist')
    } finally {
        isProcessing.value = false
    }
}

const createNewPlaylist = async () => {
    if (isProcessing.value) return
    if (!newPlaylistName.value || !userStore.id) return showToast('Nombre no válido')

    isProcessing.value = true
    showToast('Creando playlist...')

    try {
        const playlistData: PlaylistModel = {
            name: newPlaylistName.value.trim(),
            user_id: userStore.id
        }
        const playlistId = await createOrGetPlaylist(playlistData)
        await addSongToPlaylistService(playlistId, {
            video_id: selectedVideo.value.videoId,
            video_title: selectedVideo.value.title,
            video_thumbnail: selectedVideo.value.thumbnail
        })
        showToast('Playlist creada')
        showPlaylistModal.value = false
    } catch (error) {
        showToast('Error al crear')
    } finally {
        isProcessing.value = false
    }
}
</script>

<template>
    <div v-if="visible" class="search-overlay" @click.self="close">
        <div class="search-box">
            <form @submit.prevent="onSearch" class="search-form">
                <div class="d-flex flex-wrap justify-content-center align-items-center gap-3">
                    <input ref="inputRef" v-model="query" type="text" class="form-control search-input"
                        placeholder="Buscar música..." autofocus />
                    <div class="d-flex gap-2">
                        <button type="submit"
                            class="btn btn-outline-light btn-search d-flex align-items-center justify-content-center button-search-custom"
                            :disabled="searching">
                            <span v-if="searching" class="spinner-border spinner-border-sm"></span>
                            <i v-else class="bi bi-search"></i>
                        </button>
                        <button type="button"
                            class="btn btn-outline-light btn-search d-flex align-items-center justify-content-center button-search-custom"
                            @click="close">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>
            </form>

            <!-- Estado de Búsqueda Dinámica -->
            <div class="mt-3 text-center">
                <!-- Modo API Key -->
                <div v-if="apiKeys.length > 0 && currentApiKeyIndex !== -1" class="d-inline-block">
                    <span class="badge bg-success bg-opacity-75 p-2" style="border-radius: 20px;">
                        <i class="bi bi-shield-check me-1"></i>
                        Modo Seguro (Key {{ currentApiKeyIndex + 1 }}/{{ apiKeys.length }})
                    </span>
                    <span v-if="quotaExceeded" class="badge bg-warning text-dark ms-2 p-2" style="border-radius: 20px;">
                        <i class="bi bi-exclamation-triangle me-1"></i>
                        Cambiando de Key...
                    </span>
                </div>

                <!-- Modo Scraper (Búsqueda Libre con yt-dlp) -->
                <div v-else class="d-inline-block">
                    <span class="badge bg-info text-dark p-2" style="border-radius: 20px;">
                        <i class="bi bi-incognito me-1"></i>
                        Búsqueda Libre Activa
                    </span>
                    <p class="text-light small mt-2 opacity-75" style="max-width: 400px; margin: 0 auto;">
                        <i class="bi bi-lightbulb me-1"></i>
                        Para una experiencia más rápida y precisa, añade una <strong>API Key</strong> en Configuración.
                    </p>
                </div>
            </div>

            <div v-if="searchPerformed">
                <div class="d-flex justify-content-between align-items-center mt-4">
                    <h6 class="text-white mb-0">
                        <span class="result-search-text">Resultados para: "{{ query }}"</span>
                    </h6>
                    <span v-if="isUsingScraper" class="badge bg-secondary opacity-50 small">Via yt-dlp</span>
                </div>
                <div class="row gx-3 gy-4 mt-2">
                    <div v-for="(video, index) in results" :key="video.videoId" class="col-12 col-sm-6 col-lg-4 col-xl-3">
                        <div class="card h-100 flex-row shadow-sm p-2 align-items-center video-card-custom">
                            <img :src="video.thumbnail" :alt="video.title" class="rounded-start me-3 search-result-thumb"
                                style="object-fit: cover" />
                            <div class="flex-grow-1 d-flex flex-column justify-content-between text-container-custom" style="min-width: 0;">
                                <div>
                                    <h6 class="card-title text-truncate mb-1" :title="video.title"
                                        style="font-size: 0.85rem">
                                        {{ video.title }}
                                    </h6>
                                    <!-- CORREGIDO: Maneja tanto views string como número -->
                                    <p class="text-light small mb-2" v-if="video.views">
                                        <i class="bi bi-eye"></i>
                                        {{ video.views }}
                                    </p>
                                    <p class="text-light small mb-2" v-else-if="video.viewCount">
                                        <i class="bi bi-eye"></i>
                                        {{ typeof video.viewCount === 'number' ? video.viewCount.toLocaleString() :
                                        video.viewCount }} vistas
                                    </p>
                                </div>
                                <div class="d-flex justify-content-start gap-2">
                                    <button @click="playVideo(index)" class="btn btn-sm">
                                        <i class="bi bi-play-circle"></i>
                                    </button>
                                    <button @click="addToFavorites(video)" class="btn btn-sm">
                                        <i class="bi bi-heart"></i>
                                    </button>
                                    <button @click="openPlaylistModal(video)" class="btn btn-sm">
                                        <i class="bi bi-plus-lg"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="showPlaylistModal" class="modal-backdrop" @click.self="showPlaylistModal = false; isDropdownOpen = false">
            <div class="search-modal-content" @click="handleModalClick">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="text-white mb-0 fw-semibold">Agregar / Crear Playlist</h5>
                    <button class="btn-glass-refresh"
                        @click="refreshPlaylists" :disabled="loadingPlaylists"
                        title="Actualizar playlists">
                        <i :class="['bi', loadingPlaylists ? 'bi-arrow-repeat spin-animation' : 'bi-arrow-clockwise']"></i>
                    </button>
                </div>

                <div v-if="playlists.length > 0" class="mb-3">
                    <!-- Custom Glassmorphic Dropdown -->
                    <div class="custom-glass-dropdown mb-3">
                        <button type="button" class="glass-select-trigger" @click.stop="toggleDropdown">
                            <span class="d-flex align-items-center gap-2 text-truncate">
                                <i class="bi bi-music-note-list text-accent"></i>
                                <span :class="{ 'placeholder-label': !selectedPlaylistId }">
                                    {{ selectedPlaylistName || 'Selecciona una playlist' }}
                                </span>
                            </span>
                            <i class="bi bi-chevron-down dropdown-arrow" :class="{ 'rotate': isDropdownOpen }"></i>
                        </button>

                        <Transition name="dropdown-fade">
                            <div v-if="isDropdownOpen" class="glass-dropdown-menu" @click.stop>
                                <div 
                                    v-for="p in playlists" 
                                    :key="p.id" 
                                    class="glass-dropdown-item" 
                                    :class="{ 'active': selectedPlaylistId === p.id }"
                                    @click="selectPlaylist(p)"
                                >
                                    <div class="d-flex align-items-center gap-2 text-truncate">
                                        <i class="bi bi-folder2-open item-icon"></i>
                                        <span class="text-truncate">{{ p.name }}</span>
                                    </div>
                                    <i v-if="selectedPlaylistId === p.id" class="bi bi-check2 text-accent fs-6"></i>
                                </div>
                            </div>
                        </Transition>
                    </div>

                    <button class="btn btn-modal-action w-100 mb-3 d-flex align-items-center justify-content-center gap-2" @click="addToPlaylist">
                        <i class="bi bi-music-note-list"></i> Agregar a la playlist
                    </button>
                </div>

                <div>
                    <input v-model="newPlaylistName" type="text" class="form-control mb-3"
                        placeholder="Nombre de nueva playlist..." />
                    <button class="btn btn-modal-action w-100 d-flex align-items-center justify-content-center gap-2" @click="createNewPlaylist">
                        <i class="bi bi-folder-plus"></i> Crear y agregar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import url('@/assets/css/search-styles.css');
</style>
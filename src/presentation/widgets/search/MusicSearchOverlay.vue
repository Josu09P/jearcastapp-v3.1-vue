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

const query = ref('')
const results = ref<any[]>([])
const searchPerformed = ref(false)
const props = defineProps<{ visible: boolean }>()
const addingFavoritesMap = ref<Record<string, boolean>>({})
const isProcessing = ref(false)
const searching = ref(false)
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

// Método para enfocar el input
const focusInput = () => {
    setTimeout(() => {
        if (inputRef.value) {
            inputRef.value.focus()
        }
    }, 50)
}

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

    try {
        results.value = await apiKeyManager.executeWithFailover(async (key) => {
            const videos = await searchYoutube(query.value, key)
            const stats = await getVideoStats(videos.map((v: any) => v.videoId).join(','), key)
            return videos.map((v: any) => {
                const stat = stats.find((s: any) => s.videoId === v.videoId)
                return {
                    ...v,
                    viewCount: stat?.viewCount || 0
                }
            })
        })

        if (results.value.length === 0) {
            showToast('No se encontraron resultados')
        }
    } catch (error: any) {
        console.error('Error:', error)
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

            <!-- Estado de API Keys - usando variables del manager -->
            <div v-if="apiKeys.length > 0" class="mt-3 text-center">
                <span class="badge me-2" :class="currentApiKeyIndex !== -1 ? 'bg-success' : 'bg-danger'">
                    <i class="bi bi-key me-1"></i>
                    {{ currentApiKeyIndex !== -1 ? `Usando Key ${currentApiKeyIndex + 1} de ${apiKeys.length}` :
                        'Sinkeys activas' }}
                </span>
                <span v-if="quotaExceeded" class="badge bg-warning text-dark ms-2">
                    <i class="bi bi-exclamation-triangle me-1"></i>
                    Cuota excedida, cambiando de key...
                </span>
            </div>
            <div v-else class="mt-3 text-center">
                <span class="badge bg-danger">
                    <i class="bi bi-exclamation-circle me-1"></i>
                    No hay API Keys configuradas. Ve a Configuración.
                </span>
            </div>

            <div v-if="searchPerformed">
                <h6 class="text-white mt-4"><span class="result-search-text">Resultados para: "{{ query }}"</span></h6>
                <div class="row gx-3 gy-4 mt-3">
                    <div v-for="(video, index) in results" :key="video.videoId" class="col-md-6 col-lg-4 col-xl-3">
                        <div class="card h-100 flex-row shadow-sm p-2 align-items-center video-card-custom">
                            <img :src="video.thumbnail" :alt="video.title" class="rounded-start me-3"
                                style="width: 120px; height: 80px; object-fit: cover" />
                            <div class="flex-grow-1 d-flex flex-column justify-content-between" style="min-width: 0;">
                                <div>
                                    <h6 class="card-title text-truncate mb-1" :title="video.title"
                                        style="font-size: 0.85rem">
                                        {{ video.title }}
                                    </h6>
                                    <p class="text-light small mb-2">
                                        <i class="bi bi-eye"></i>
                                        {{ video.viewCount.toLocaleString() }} vistas
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
        <div v-if="showPlaylistModal" class="modal-backdrop" @click.self="showPlaylistModal = false">
            <div class="search-modal-content">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="text-white mb-0">Agregar / Crear Playlist</h5>
                    <button class="btn btn-outline-light d-flex align-items-center justify-content-center"
                        @click="refreshPlaylists" :disabled="loadingPlaylists"
                        style="border-radius: 1rem; height: 36px; padding: 0 10px;">
                        <i :class="['bi', 'me-0', loadingPlaylists ? 'bi-arrow-repeat spin-animation' : 'bi-arrow-clockwise']"
                            style="font-size: 16px; vertical-align: middle; line-height: 1;"></i>
                    </button>
                </div>

                <div v-if="playlists.length > 0" class="mb-3">
                    <select v-model="selectedPlaylistId" class="form-select mb-2">
                        <option disabled value="">Selecciona una playlist</option>
                        <option v-for="p in playlists" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                    <button class="btn btn-outline-light btn-search w-100 mb-3" @click="addToPlaylist">Agregar a la
                        playlist</button>
                </div>

                <div>
                    <input v-model="newPlaylistName" type="text" class="form-control mb-2"
                        placeholder="Nueva playlist..." />
                    <button class="btn btn-outline-light btn-search w-100" @click="createNewPlaylist">Crear y
                        agregar</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import url('@/assets/css/search-styles.css');
</style>
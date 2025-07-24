<template>
    <div v-if="visible" class="search-overlay" @click.self="close">
        <div class="search-box">
            <form @submit.prevent="onSearch" class="search-form">
                <div class="d-flex flex-wrap justify-content-center align-items-center gap-3">
                    <input v-model="query" type="text" class="form-control search-input" placeholder="Buscar música..."
                        autofocus />
                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-outline-light  btn-search">Buscar</button>
                        <button type="button" class="btn btn-outline-light btn-search" @click="close">Cerrar</button>
                    </div>
                </div>
            </form>

            <div v-if="searchPerformed">
                <h6 class="text-white mt-4">Resultados para: "{{ query }}"</h6>
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
                    <h5 class="text-white mb-0">Agregar o crear playlist</h5>
                    <button class="btn btn-outline-light" @click="refreshPlaylists" style="border-radius: 10px;"><i
                            class="bi bi-arrow-clockwise"></i></button>
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

<script setup lang="ts">
import { onMounted, ref } from 'vue'
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

const query = ref('')
const results = ref<any[]>([])
const searchPerformed = ref(false)
const props = defineProps<{ visible: boolean }>()
const addingFavoritesMap = ref<Record<string, boolean>>({})
const isProcessing = ref(false)

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'openPlaylistModal', video: any): void
}>()
const close = () => emit('close')
const userStore = useUserStore()
const playerStore = usePlayerStore()
const playlists = ref<PlaylistModel[]>([])
const selectedPlaylistId = ref('')
const newPlaylistName = ref('')
const showPlaylistModal = ref(false)
const selectedVideo = ref<any | null>(null)

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
    playlists.value = await getPlaylistsByUser(userStore.id)
    showToast('Playlists actualizadas')
}

onMounted(async () => {
    if (!userStore.id) return
    playlists.value = await getPlaylistsByUser(userStore.id)
})
const onSearch = async () => {
    if (!query.value || !userStore.apikeyYoutube) return
    searchPerformed.value = true
    results.value = []

    const videos = await searchYoutube(query.value, userStore.apikeyYoutube)
    const stats = await getVideoStats(videos.map((v: any) => v.videoId).join(','), userStore.apikeyYoutube)

    results.value = videos.map((v: any) => {
        const stat = stats.find((s: any) => s.videoId === v.videoId)
        return {
            ...v,
            viewCount: stat?.viewCount || 0
        }
    })
}

const playVideo = (index: number) => {
    const playlist = results.value.map((video: any) => ({
        video_id: video.videoId,
        video_title: video.title,
        video_thumbnail: video.thumbnail
    }))

    // Guardar en localStorage
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

    // Marcar como "en proceso"
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
}

const openPlaylistModal = (video: any) => {
    selectedVideo.value = video
    showPlaylistModal.value = true
}

// ADD NEW SONG 100%
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


// CREATE NEW PLAYLIST 100%
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

        showToast('Canción añadida a la nueva playlist')
        showPlaylistModal.value = false
    } catch (error) {
        showToast('Error al crear la playlist')
    } finally {
        isProcessing.value = false
    }
}
</script>

<style scoped>
.search-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    backdrop-filter: blur(10px);
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 60px;
}

.search-box {
    background-color: rgba(255, 255, 255, 0.05);
    padding: 24px;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    border: 0.5px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.3rem;
    width: 90%;
    max-width: 1200px;
    color: white;
}

.search-form input {
    max-width: 300px;
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 1.3rem;
    height: 40px;
    padding: 10px 14px;
    backdrop-filter: blur(4px);
}

.btn-search {
    border-radius: 1.0rem;
    font-size: 15px;
}

.video-card-custom {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    backdrop-filter: blur(6px);
    color: white;
}

.search-input::placeholder {
    color: rgb(142, 142, 142);
    font-size: 14px;
    text-align: center;
    border: none;
}

.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(5px);
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1040;
    display: flex;
    align-items: center;
    justify-content: center;
}

.search-modal-content {
    background-color: #8f8f8f52;
    padding: 20px;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

input::placeholder {
    color: #cccccc;
    opacity: 1;
}

.button-74 {
    background-color: #d9d9d98d;
    border: 2px solid #422800;
    border-radius: 20px;
    box-shadow: #422800 2px 2px 0 0;
    color: white;
    cursor: pointer;
    display: inline-block;
    font-weight: 600;
    font-size: 14px;
    padding: 0 14px;
    line-height: 36px;
    text-align: center;
    text-decoration: none;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
    transition: all 0.1s ease-in-out;
}

.button-74:hover {
    background-color: #836a6ad4;
}

.button-74:active {
    box-shadow: #422800 1px 1px 0 0;
    transform: translate(1px, 1px);
}

@media (min-width: 768px) {
    .button-74 {
        min-width: 90px;
        padding: 0 18px;
    }
}
</style>

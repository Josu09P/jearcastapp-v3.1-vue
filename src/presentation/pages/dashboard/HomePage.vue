<template>
    <DashboardLayout>
        <section class="container py-4">
            <!-- Tarjetas de estadísticas -->
            <div class="row g-4">
                <!-- Favoritos -->
                <div class="col-md-6 col-xl-4">
                    <div class="card h-100 glass-card text-white p-3 shadow d-flex flex-column justify-content-between">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="mb-0"><i class="bi bi-heart-fill text-danger me-2"></i>Tus Favoritos</h5>
                            <span class="badge bg-danger fs-6">{{ totalFavorites }}</span>
                        </div>
                        <img src="https://cdn-icons-png.flaticon.com/512/833/833472.png" alt="Favoritos"
                            class="img-fluid mx-auto"
                            style="max-height: 80px; filter: drop-shadow(0 0 6px white); margin-bottom: 20px; margin-top: 20px;" />
                    </div>
                </div>

                <!-- Playlists -->
                <div class="col-md-6 col-xl-4">
                    <div class="card h-100 glass-card text-white p-3 shadow d-flex flex-column justify-content-between">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="mb-0"><i class="bi bi-music-note-list me-2"></i>Tus Playlists</h5>
                            <span class="badge bg-primary fs-6">{{ totalPlaylists }}</span>
                        </div>
                        <img src="https://cdn-icons-png.flaticon.com/512/984/984451.png" alt="Playlist"
                            class="img-fluid mx-auto"
                            style="max-height: 95px; filter: drop-shadow(0 0 6px white); margin-bottom: 20px; margin-top: 20px;" />
                    </div>
                </div>

                <!-- Recomendados -->
                <div class="col-md-6 col-xl-4">
                    <div class="card h-100 glass-card text-white p-3 shadow d-flex flex-column justify-content-between">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="mb-0"><i class="bi bi-stars me-2 text-warning"></i>Playlist JearCastApp</h5>
                            <span class="badge bg-warning text-dark fs-6">{{ totalRecommended }}</span>
                        </div>
                        <img src="https://cdn-icons-png.flaticon.com/512/2909/2909734.png" alt="Recomendados"
                            class="img-fluid mx-auto"
                            style="max-height: 80px; filter: drop-shadow(0 0 6px white); margin-bottom: 20px; margin-top: 20px;" />

                    </div>
                </div>
            </div>

            <!-- Historial de reproducción -->
            <div class="row g-4 mt-4">
                <!-- Historial -->
                <div class="col-md-9">
                    <div class="card glass-card text-white p-4 shadow" style="max-height: 450px;">
                        <h5 class="mb-3"><i class="bi bi-clock-history me-2"></i>Tus reproducciones</h5>
                        <p class="text-truncate mb-3" style="font-size: 13px;">
                            Aquí aparecerán las últimas músicas reproducidas desde el buscador.
                            <br />
                            <span style="font-size: 10px;">
                                <i class="bi bi-exclamation-triangle me-2"></i> Cuando cierres sesión los datos se
                                perderán.
                            </span>
                        </p>

                        <div v-if="recentlyPlayed.length" class="overflow-auto pe-2" style="max-height: 300px;">
                            <div class="d-flex flex-column gap-3">
                                <div v-for="(video, index) in recentlyPlayed" :key="video.video_id"
                                    class="d-flex align-items-center justify-content-between rounded p-2"
                                    style="background-color: var(--primary-bg) !important;;backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);border: 0.5px solid rgba(255, 255, 255, 0.1);">

                                    <div class="d-flex align-items-center gap-3">
                                        <img :src="video.video_thumbnail" alt="thumbnail" width="60" height="40"
                                            class="rounded"
                                            style="object-fit: cover; box-shadow: 0 0 5px rgba(255,255,255,0.3);" />
                                        <span class="text-white text-truncate" style="max-width: 200px;">{{
                                            video.video_title }}</span>
                                    </div>

                                    <div class="d-flex gap-2">
                                        <button @click="playVideo(index)" class="btn btn-sm"
                                            style="border: 0.5px solid #f4f4f4; border-radius: 1rem;">
                                            <i class="bi bi-play-circle" style="color: #f4f4f4;"></i>
                                        </button>
                                        <button @click="addToFavorites(video)" class="btn btn-sm"
                                            style="border: 0.5px solid #f4f4f4; border-radius: 1rem;">
                                            <i class="bi bi-heart" style="color: #f4f4f4;"></i>
                                        </button>
                                        <button @click="openPlaylistModal(video)" class="btn btn-sm"
                                            style="border: 0.5px solid #f4f4f4; border-radius: 1rem;">
                                            <i class="bi bi-plus-lg" style="color: #f4f4f4;"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-else class="text-center text-muted mt-3">
                            <i class="bi bi-music-note-beamed"></i> No hay reproducciones recientes aún.
                        </div>
                    </div>
                </div>

                <!-- Espacio reservado para el reproductor -->
                <div class="col-md-3 d-none d-md-block">
                    <div class="glass-card d-flex align-items-center justify-content-center text-white text-center p-3 shadow"
                        style="height: 450px;">
                        <div>
                            <i class="bi bi-box-arrow-in-down-right fs-1 mb-2"></i>
                            <p class="mb-0" style="font-size: 14px;">
                                Si te hace feliz<br />
                                mueve el reproductor aqui <br>
                                <span style="font-size: 13px;">(solo es para que tengas donde ubicarlo, <br>
                                    no hay magia, funcionalidad o anclamiento de por medio)</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>


            <div v-if="showPlaylistModal" class="modal-backdrop" @click.self="showPlaylistModal = false">
                <div class="search-modal-content">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="text-white mb-0">Agregar a playlist</h5>
                        <button class="btn btn-outline-light" @click="refreshPlaylists" style="border-radius: 10px;"><i
                                class="bi bi-arrow-clockwise"></i></button>
                    </div>

                    <div v-if="playlists.length > 0" class="mb-3">
                        <select v-model="selectedPlaylistId" class="form-select mb-2">
                            <option disabled value="">Selecciona una playlist</option>
                            <option v-for="p in playlists" :key="p.id" :value="p.id">{{ p.name }}</option>
                        </select>
                        <button class="button-74 w-100 mb-3" @click="addToPlaylist">Agregar a la playlist</button>
                    </div>

                    <div>
                        <input v-model="newPlaylistName" type="text" class="form-control mb-2"
                            placeholder="Nueva playlist..." />
                        <button class="button-74 w-100" @click="createNewPlaylist">Crear y agregar</button>
                    </div>
                </div>
            </div>
        </section>
    </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'
import { usePlayerStore } from '@/stores/player-store'
import { useUserStore } from '@/stores/user'
import { getFavoritesByUser } from '@/domain/usecases/favorites/GetFavoritesByUser'
import { getPlaylistsByUser } from '@/domain/usecases/playlists/GetPlaylistsByUser'
import { getRecommendedPlaylists } from '@/domain/usecases/recommended/GetRecommendedPlaylists'
import StartToastifyInstance from 'toastify-js'
import Toastify from 'toastify-js'
import type { PlaylistModel } from '@/domain/models/PlayListModel'
import { addFavoriteMusic } from '@/domain/usecases/favorites/AddFavoriteMusic'
import { songExistsInPlaylist } from '@/domain/usecases/playlists/SongExistsInPlaylist'
import { addSongToPlaylistService } from '@/data/services/firestore/PlaylistsFirestore'
import { createOrGetPlaylist } from '@/domain/usecases/playlists/CreateOrGetPlaylist'

const playerStore = usePlayerStore()
const userStore = useUserStore()
const totalFavorites = ref(0)
const totalPlaylists = ref(0)
const totalRecommended = ref(0)
const recentlyPlayed = ref<any[]>([])
const emit = defineEmits<{
    (e: 'close'): void
    (e: 'openPlaylistModal', video: any): void
}>()
const playlists = ref<PlaylistModel[]>([])
const selectedPlaylistId = ref('')
const newPlaylistName = ref('')
const showPlaylistModal = ref(false)
const selectedVideo = ref<any | null>(null)
const playVideo = (index: number) => {
    if (!recentlyPlayed.value.length) return

    const playlist = recentlyPlayed.value.map(video => ({
        video_id: video.video_id,
        video_title: video.video_title,
        video_thumbnail: video.video_thumbnail
    }))

    // Seteamos la playlist completa y comenzamos en el índice deseado
    playerStore.setPlaylist(playlist, index)
}

const showToast = (text: string) => {
    StartToastifyInstance({
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


const addToFavorites = async (video: any) => {
    if (!userStore.id) return
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
onMounted(async () => {
    const userId = userStore.id
    if (!userId) return

    const [favorites, playlistsData, recommended] = await Promise.all([
        getFavoritesByUser(userId),
        getPlaylistsByUser(userId),
        getRecommendedPlaylists()
    ])

    totalFavorites.value = favorites.length
    totalPlaylists.value = playlistsData.length
    totalRecommended.value = recommended.length
    playlists.value = playlistsData

    const stored = localStorage.getItem('recentlyPlayed')
    if (stored) {
        recentlyPlayed.value = JSON.parse(stored)
    }
})

// ADD NEW SONG 100%
const addToPlaylist = async () => {
    if (!userStore.id || !selectedVideo.value || !selectedPlaylistId.value) {
        return showToast('Faltan datos para agregar a la playlist')
    }

    Toastify({
        text: 'Añadiendo a la playlist...',
        duration: 1500,
        gravity: 'top',
        position: 'right',
        className: 'toast-glass',
        stopOnFocus: false
    }).showToast()

    try {
        const exists = await songExistsInPlaylist(selectedPlaylistId.value, selectedVideo.value.video_id)

        if (exists) {
            return showToast('La canción ya está en esta playlist')
        }

        await addSongToPlaylistService(selectedPlaylistId.value, {
            video_id: selectedVideo.value.video_id,
            video_title: selectedVideo.value.video_title,
            video_thumbnail: selectedVideo.value.video_thumbnail
        })


        showToast('Agregado a la playlist')
        showPlaylistModal.value = false
    } catch (error) {
        showToast('Error al agregar a la playlist')
    }
}

// CREATE NEW PLAYLIST 100%
const createNewPlaylist = async () => {
    if (!newPlaylistName.value || !userStore.id) return showToast('Nombre no válido')

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
}
</script>

<style scoped>
.glass-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    backdrop-filter: blur(8px);
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
    /* o el color que desees */
    border: 2px solid #ffffff !important;
    opacity: 1;
    /* opcional: asegura que no esté opaco */
}

input.form-control {
    border: 1px solid #a8a8a8;
    border-radius: 1.4rem !important;
    height: 40px;
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

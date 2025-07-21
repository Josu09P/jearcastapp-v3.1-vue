<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'
import Toastify from 'toastify-js'
import Swal from 'sweetalert2'
import type { PlaylistModel } from '@/domain/models/PlayListModel'
import type { PlaylistSongModel } from '@/domain/models/PlaylistSongModel'
import { getPlaylistsByUser } from '@/domain/usecases/playlists/GetPlaylistsByUser'
import { getSongsFromPlaylist } from '@/domain/usecases/playlists/GetSongsFromPlaylist'
import { deleteSongFromPlaylist } from '@/domain/usecases/playlists/DeleteSongFromPlaylist'
import { deletePlaylist } from '@/domain/usecases/playlists/DeletePlayList'
import { usePlayerStore } from '@/stores/player-store'

const playlists = ref<PlaylistModel[]>([])
const songs = ref<PlaylistSongModel[]>([])
const currentPlaylistId = ref<string | null>(null)
const deletingMap = ref<Record<string, boolean>>({})
const loadingPlaylists = ref(false)

const LOCAL_PLAYLIST_KEY = 'jearcast_selectedPlaylistId'

const getUserId = (): string | null => {
    const raw = localStorage.getItem('userJearCastInfo')
    if (!raw) return null
    try {
        const parsed = JSON.parse(raw)
        return parsed.id || null
    } catch {
        return null
    }
}

function saveSelectedPlaylist(id: string) {
    currentPlaylistId.value = id
    localStorage.setItem(LOCAL_PLAYLIST_KEY, id)
}

async function loadPlaylists() {
    const userId = getUserId()
    if (!userId) return

    loadingPlaylists.value = true
    try {
        playlists.value = await getPlaylistsByUser(userId)
    } catch (e) {
        Toastify({ text: 'Error cargando playlists', className: 'toast-glass', gravity: 'top', position: 'right' }).showToast()
    } finally {
        loadingPlaylists.value = false
    }
}

async function loadSongs(playlistId: string) {
    saveSelectedPlaylist(playlistId)
    try {
        songs.value = await getSongsFromPlaylist(playlistId)
    } catch (e) {
        Toastify({ text: 'Error cargando canciones', className: 'toast-glass', gravity: 'top', position: 'right' }).showToast()
    }
}

function playSong(index: number) {
    const playlist = songs.value.map(song => ({
        video_id: song.video_id,
        video_title: song.video_title,
        video_thumbnail: song.video_thumbnail
    }))
    const playerStore = usePlayerStore()
    playerStore.setPlaylist(playlist, index)
}

async function deleteSong(videoId: string) {
    if (!currentPlaylistId.value) return
    deletingMap.value[videoId] = true
    Toastify({ text: 'Eliminando canción...', className: 'toast-glass', gravity: 'top', position: 'right' }).showToast()

    try {
        await deleteSongFromPlaylist(currentPlaylistId.value, videoId)
        songs.value = songs.value.filter(song => song.video_id !== videoId)
        Toastify({ text: 'Canción eliminada', className: 'toast-glass', gravity: 'top', position: 'right' }).showToast()
    } catch {
        Toastify({ text: 'Error al eliminar canción', className: 'toast-glass', gravity: 'top', position: 'right' }).showToast()
    } finally {
        deletingMap.value[videoId] = false
    }
}

async function confirmDeletePlaylist(playlistId: string) {
    const result = await Swal.fire({
        title: '¿Eliminar playlist?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        customClass: {
            popup: 'glass-modal',
            title: 'text-white',
            htmlContainer: 'text-white',
            confirmButton: 'btn btn-danger me-2',
            cancelButton: 'btn btn-secondary'
        },
        buttonsStyling: false
    })

    if (result.isConfirmed) {
        try {
            await deletePlaylist(playlistId)
            playlists.value = playlists.value.filter(p => p.id !== playlistId)
            songs.value = []
            localStorage.removeItem(LOCAL_PLAYLIST_KEY)
            Toastify({ text: 'Playlist eliminada', gravity: 'top', position: 'right', backgroundColor: '#dc3545' }).showToast()
        } catch {
            Toastify({ text: 'Error al eliminar playlist', gravity: 'top', position: 'right' }).showToast()
        }
    }
}

onMounted(async () => {
    await loadPlaylists()

    const savedId = localStorage.getItem(LOCAL_PLAYLIST_KEY)
    if (savedId) {
        loadSongs(savedId)
    }
})
</script>

<template>
    <DashboardLayout>
        <div class="container">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="text-white mb-0 title-page">Playlists</h4>
                <button @click="loadPlaylists" class="btn btn-outline-light btn-sm" :disabled="loadingPlaylists">
                    <span v-if="loadingPlaylists" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-arrow-clockwise me-1"></i> Recargar
                </button>
            </div>

            <div class="d-flex flex-wrap gap-2 mb-3">
                <div v-for="playlist in playlists" :key="playlist.id" class="btn-group">
                    <button class="btn btn-outline-light btn-sm" @click="loadSongs(playlist.id!)">
                        {{ playlist.name }}
                    </button>
                    <button class="btn btn-outline-light btn-sm" @click="confirmDeletePlaylist(playlist.id!)">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>

            <div class="text-white rounded shadow mt-4 container-player-jear" id="player-playlist-container"></div>

            <div v-if="songs.length > 0" class="container-scroll-wrapper-all mt-3 p-3 rounded">
                <div class="row">
                    <div v-for="(song, index) in songs" :key="song.video_id"
                        class="col-12 col-md-6 col-lg-6 col-xl-3 mb-3">
                        <div class="card h-100 flex-row shadow-sm p-2 align-items-center video-card-custom">
                            <img :src="song.video_thumbnail" :alt="song.video_title" class="rounded-start me-3"
                                style="width: 120px; height: 80px; object-fit: cover" />
                            <div class="flex-grow-1 d-flex flex-column justify-content-between" style="min-width: 0;">
                                <h6 class="card-title text-truncate mb-1" :title="song.video_title"
                                    style="font-size: 0.85rem;">{{ song.video_title }}</h6>
                                <div class="d-flex justify-content-start gap-2" style="margin: 10px 0 0 20px">
                                    <button @click="playSong(index)" class="btn btn-sm">
                                        <i class="bi bi-play-circle"></i>
                                    </button>
                                    <button @click="deleteSong(song.video_id)" class="btn btn-sm text-light"
                                        :disabled="deletingMap[song.video_id]">
                                        <span v-if="deletingMap[song.video_id]"
                                            class="spinner-border spinner-border-sm"></span>
                                        <i v-else class="bi bi-trash-fill"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="text-white p-4">Selecciona una playlist para ver sus canciones.</div>
        </div>
    </DashboardLayout>
</template>

<style scoped>
.title-page {
    font-size: 1.5rem;
}
</style>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
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
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const playlists = ref<PlaylistModel[]>([])
const songs = ref<PlaylistSongModel[]>([])
const currentPlaylistId = ref<string | null>(null)
const currentPlaylistName = ref<string>('')
const deletingMap = ref<Record<string, boolean>>({})
const playlistSongCounts = ref<Record<string, number>>({})
const playlistImages = ref<Record<string, string>>({})
const loadingPlaylists = ref(false)
const loadingSongs = ref(false)
const sortOption = ref<'recent' | 'alphabetical'>('recent')
const showAllPlaylists = ref(true)

const LOCAL_PLAYLIST_KEY = 'jearcast_selectedPlaylistId'
const PLAYLIST_IMAGES_KEY = 'jearcast_playlist_images'

// ==================== UTILIDADES ====================
const getUserId = (): string | null => {
    return userStore.id || null
}

// Cargar imágenes guardadas de localStorage
const loadPlaylistImages = () => {
    const stored = localStorage.getItem(PLAYLIST_IMAGES_KEY)
    if (stored) {
        try {
            playlistImages.value = JSON.parse(stored)
        } catch (e) {
            console.error('Error cargando imágenes:', e)
        }
    }
}

// Guardar imagen de playlist en localStorage
const savePlaylistImage = (playlistId: string, imageData: string) => {
    playlistImages.value[playlistId] = imageData
    localStorage.setItem(PLAYLIST_IMAGES_KEY, JSON.stringify(playlistImages.value))
}

// ==================== SELECCIÓN DE IMAGEN ====================
const selectPlaylistImage = async (playlistId: string) => {
    try {
        const { value: file } = await Swal.fire({
            title: 'Seleccionar imagen',
            text: 'Elige una imagen para la playlist',
            icon: 'question',
            input: 'file',
            inputAttributes: {
                'accept': 'image/*',
                'aria-label': 'Sube tu imagen'
            },
            showCancelButton: true,
            confirmButtonText: 'Subir',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'glass-modal',
                title: 'text-white',
                htmlContainer: 'text-white',
                confirmButton: 'btn btn-primary me-2',
                cancelButton: 'btn btn-secondary'
            },
            buttonsStyling: false
        })

        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const imageData = e.target?.result as string
                savePlaylistImage(playlistId, imageData)

                Toastify({
                    text: 'Imagen guardada correctamente',
                    duration: 3000,
                    className: 'toast-glass',
                    gravity: 'top',
                    position: 'right'
                }).showToast()
            }
            reader.readAsDataURL(file)
        }
    } catch (error) {
        console.error('Error al seleccionar imagen:', error)
    }
}

// ==================== PLAYLISTS ====================
async function loadPlaylists() {
    const userId = getUserId()
    if (!userId) return

    loadingPlaylists.value = true
    try {
        playlists.value = await getPlaylistsByUser(userId)

        // Cargar imágenes guardadas
        loadPlaylistImages()

        // Cargar conteo de canciones para cada playlist
        for (const playlist of playlists.value) {
            if (playlist.id) {
                try {
                    const playlistSongs = await getSongsFromPlaylist(playlist.id)
                    playlistSongCounts.value[playlist.id] = playlistSongs.length
                } catch (e) {
                    console.error(`Error cargando canciones para playlist ${playlist.id}:`, e)
                    playlistSongCounts.value[playlist.id] = 0
                }
            }
        }
    } catch (e) {
        Toastify({
            text: 'Error cargando playlists',
            className: 'toast-glass',
            gravity: 'top',
            position: 'right'
        }).showToast()
    } finally {
        loadingPlaylists.value = false
    }
}

function saveSelectedPlaylist(id: string, name: string) {
    currentPlaylistId.value = id
    currentPlaylistName.value = name
    showAllPlaylists.value = false
    localStorage.setItem(LOCAL_PLAYLIST_KEY, id)
}

function showAllPlaylistsView() {
    currentPlaylistId.value = null
    currentPlaylistName.value = ''
    showAllPlaylists.value = true
    songs.value = []
    localStorage.removeItem(LOCAL_PLAYLIST_KEY)
}

// ==================== CANCIONES ====================
async function loadSongs(playlistId: string, playlistName: string) {
    saveSelectedPlaylist(playlistId, playlistName)
    loadingSongs.value = true

    try {
        songs.value = await getSongsFromPlaylist(playlistId)
        playlistSongCounts.value[playlistId] = songs.value.length
    } catch (e) {
        Toastify({
            text: 'Error cargando canciones',
            className: 'toast-glass',
            gravity: 'top',
            position: 'right'
        }).showToast()
    } finally {
        loadingSongs.value = false
    }
}

// ==================== ORDENAMIENTO ====================
const sortedSongs = computed(() => {
    if (sortOption.value === 'recent') {
        return [...songs.value].sort((a, b) => {
            const dateA = a.added_at?.toDate?.()?.getTime() || 0
            const dateB = b.added_at?.toDate?.()?.getTime() || 0
            return dateB - dateA
        })
    } else {
        return [...songs.value].sort((a, b) => {
            return a.video_title.localeCompare(b.video_title)
        })
    }
})

function toggleSortOption() {
    sortOption.value = sortOption.value === 'recent' ? 'alphabetical' : 'recent'
}

// ==================== REPRODUCCIÓN ====================
function playSong(index: number) {
    const playlist = sortedSongs.value.map(song => ({
        video_id: song.video_id,
        video_title: song.video_title,
        video_thumbnail: song.video_thumbnail
    }))
    const playerStore = usePlayerStore()
    playerStore.setPlaylist(playlist, index)
}

function playAll() {
    if (sortedSongs.value.length > 0) {
        playSong(0)
    }
}

// ==================== ELIMINAR CANCIÓN ====================
async function deleteSong(videoId: string) {
    if (!currentPlaylistId.value) return

    deletingMap.value[videoId] = true
    Toastify({
        text: 'Eliminando canción...',
        className: 'toast-glass',
        gravity: 'top',
        position: 'right'
    }).showToast()

    try {
        await deleteSongFromPlaylist(currentPlaylistId.value, videoId)
        songs.value = songs.value.filter(song => song.video_id !== videoId)

        // Actualizar conteo
        if (currentPlaylistId.value) {
            playlistSongCounts.value[currentPlaylistId.value] = songs.value.length
        }

        Toastify({
            text: 'Canción eliminada',
            className: 'toast-glass',
            gravity: 'top',
            position: 'right'
        }).showToast()
    } catch {
        Toastify({
            text: 'Error al eliminar canción',
            className: 'toast-glass',
            gravity: 'top',
            position: 'right'
        }).showToast()
    } finally {
        deletingMap.value[videoId] = false
    }
}

// ==================== ELIMINAR PLAYLIST ====================
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

            // Eliminar imagen guardada
            if (playlistImages.value[playlistId]) {
                delete playlistImages.value[playlistId]
                localStorage.setItem(PLAYLIST_IMAGES_KEY, JSON.stringify(playlistImages.value))
            }

            if (currentPlaylistId.value === playlistId) {
                songs.value = []
                currentPlaylistId.value = null
                currentPlaylistName.value = ''
                showAllPlaylists.value = true
                localStorage.removeItem(LOCAL_PLAYLIST_KEY)
            }

            Toastify({
                text: 'Playlist eliminada',
                className: 'toast-glass',
                gravity: 'top',
                position: 'right',
                backgroundColor: '#dc3545'
            }).showToast()
        } catch {
            Toastify({
                text: 'Error al eliminar playlist',
                className: 'toast-glass',
                gravity: 'top',
                position: 'right'
            }).showToast()
        }
    }
}

// ==================== WATCHERS ====================
// Actualizar conteo cuando cambian las canciones
watch(songs, (newSongs) => {
    if (currentPlaylistId.value) {
        playlistSongCounts.value[currentPlaylistId.value] = newSongs.length
    }
}, { deep: true })

// ==================== LIFECYCLE ====================
onMounted(async () => {
    await loadPlaylists()

    const savedId = localStorage.getItem(LOCAL_PLAYLIST_KEY)
    if (savedId) {
        const savedPlaylist = playlists.value.find(p => p.id === savedId)
        if (savedPlaylist) {
            await loadSongs(savedId, savedPlaylist.name)
        }
    }
})
</script>

<template>
    <DashboardLayout>
        <div class="container-fluid px-0">
            <!-- HEADER con título y controles estilo favoritos -->
            <div class="d-flex justify-content-between align-items-center mb-4 px-3">
                <div class="d-flex align-items-center gap-3">
                    <h4 class="text-white mb-0 fw-bold">Playlists</h4>

                    <!-- Botón "Ver todas" cuando hay una playlist seleccionada -->
                    <button v-if="!showAllPlaylists" @click="showAllPlaylistsView"
                        class="btn btn-sm rounded-pill px-3 filter-button-playlists text-white">
                        <i class="bi bi-arrow-left me-1"></i> Ver todas
                    </button>
                </div>

                <div class="d-flex gap-2">
                    <!-- Selector de orden (solo visible cuando hay canciones) -->
                    <button v-if="songs.length > 0" @click="toggleSortOption"
                        class="btn btn-dark btn-sm rounded-pill px-3 filter-button-playlists">
                        <i :class="sortOption === 'recent' ? 'bi bi-clock-history' : 'bi bi-sort-alpha-down'"
                            class="me-1" />
                        {{ sortOption === 'recent' ? 'Recientes' : 'A-Z' }}
                    </button>

                    <!-- Botón recargar playlists -->
                    <button @click="loadPlaylists" :disabled="loadingPlaylists"
                        class="btn btn-outline-light btn-sm rounded-pill px-3 refresh-button-playlists">
                        <span v-if="loadingPlaylists" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-arrow-clockwise"></i>
                    </button>
                </div>
            </div>

            <!-- SECCIÓN DE PLAYLISTS (cards cuadradas estilo Spotify) - SOLO si showAllPlaylists es true -->
            <div v-if="showAllPlaylists" class="playlists-grid px-3 mb-4">
                <div v-for="playlist in playlists" :key="playlist.id" class="playlist-card-wrapper">
                    <div class="playlist-card" :class="{ 'active': currentPlaylistId === playlist.id }">

                        <!-- Imagen de fondo con overlay -->
                        <div class="playlist-image-wrapper" @click="loadSongs(playlist.id!, playlist.name)">
                            <!-- Imagen personalizada o placeholder -->
                            <img :src="playlistImages[playlist.id!] || 'https://via.placeholder.com/300x300/1a1a1a/666666?text=Playlist'"
                                :alt="playlist.name" class="playlist-image" />

                            <!-- Overlay con blur y botón play -->
                            <div class="playlist-overlay">
                                <button class="play-button" @click.stop="loadSongs(playlist.id!, playlist.name)">
                                    <i class="bi bi-play-fill"></i>
                                </button>
                            </div>

                            <!-- Badge con cantidad de canciones (AHORA FUNCIONA) -->
                            <span class="song-count-badge">
                                <i class="bi bi-music-note-beamed me-1"></i>
                                {{ playlistSongCounts[playlist.id!] || 0 }}
                            </span>

                            <!-- Botón para cambiar imagen -->
                            <button class="change-image-btn" @click.stop="selectPlaylistImage(playlist.id!)">
                                <i class="bi bi-camera"></i>
                            </button>

                            <!-- Botón eliminar playlist -->
                            <button class="delete-playlist-btn" @click.stop="confirmDeletePlaylist(playlist.id!)">
                                <i class="bi bi-trash3"></i>
                            </button>
                        </div>

                        <!-- Información de la playlist -->
                        <div class="playlist-info">
                            <h6 class="playlist-name">{{ playlist.name }}</h6>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CONTENEDOR DEL PLAYER -->
            <div class="text-white rounded shadow mt-4 container-player-jear" id="player-playlist-container"></div>

            <!-- LISTA DE CANCIONES (estilo favoritos) -->
            <div v-if="songs.length > 0" class="mt-4 px-3">
                <!-- Header de la playlist seleccionada -->
                <div class="d-flex align-items-center gap-3 mb-3">
                    <h5 class="text-white mb-0">{{ currentPlaylistName }}</h5>
                    <span class="badge bg-secondary bg-opacity-25 text-white">
                        {{ songs.length }} {{ songs.length === 1 ? 'canción' : 'canciones' }}
                    </span>
                    <button @click="playAll" class="btn btn-sm btn-outline-light rounded-pill px-3 play-all-button">
                        <i class="bi bi-play-fill me-1"></i> Reproducir todo
                    </button>
                </div>

                <!-- Cabecera de columnas (solo desktop) -->
                <div class="row px-3 py-2 text-secondary d-none d-md-flex mb-2 border-bottom border-white border-opacity-10"
                    style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">
                    <div class="col-1 text-center">#</div>
                    <div class="col-6">Título</div>
                    <div class="col-3 text-center">Agregado el</div>
                    <div class="col-2 text-center">Acciones</div>
                </div>

                <!-- Lista de canciones -->
                <div class="px-0">
                    <div v-for="(song, index) in sortedSongs" :key="song.video_id"
                        class="song-row row align-items-center p-2 mx-0 mb-1" @dblclick="playSong(index)">

                        <!-- Columna # / Play -->
                        <div class="col-1 text-secondary index-col text-center">
                            <span class="number">{{ index + 1 }}</span>
                            <i class="bi bi-play-fill play-icon text-white" @click="playSong(index)"></i>
                        </div>

                        <!-- Info canción -->
                        <div class="col-10 col-md-6 d-flex align-items-center gap-3">
                            <img :src="song.video_thumbnail" class="rounded shadow-sm"
                                style="width: 48px; height: 48px; object-fit: cover" />
                            <div class="text-truncate">
                                <h6 class="text-white mb-0 text-truncate fw-semibold" style="font-size: 0.9rem;">
                                    {{ song.video_title }}
                                </h6>
                                <small class="text-secondary">YouTube Music</small>
                            </div>
                        </div>

                        <!-- Fecha (solo desktop) -->
                        <div class="col-3 d-none d-md-block text-secondary small text-center font-monospace">
                            {{ song.added_at?.toDate().toLocaleDateString() || 'Fecha desconocida' }}
                        </div>

                        <!-- Acciones -->
                        <div class="col-1 col-md-2 d-flex justify-content-center align-items-center">
                            <button @click="deleteSong(song.video_id)" class="btn btn-link p-0 remove-btn">
                                <span v-if="deletingMap[song.video_id]"
                                    class="spinner-border spinner-border-sm text-secondary"></span>
                                <i v-else class="bi bi-trash3 text-secondary"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Estado vacío -->
            <div v-else-if="showAllPlaylists && playlists.length === 0" class="text-white-50 p-4 text-center">
                <i class="bi bi-music-note-beamed fs-1 d-block mb-3"></i>
                <p>No tienes playlists creadas aún.</p>
            </div>

            <div v-else-if="!showAllPlaylists && songs.length === 0" class="text-white-50 p-4 text-center">
                <i class="bi bi-music-note-beamed fs-1 d-block mb-3"></i>
                <p>Esta playlist no tiene canciones aún.</p>
            </div>
        </div>
    </DashboardLayout>
</template>

<style scoped>
@import url('@/assets/css/playlist-styles.css');

.refresh-button-playlists {
    transition: background-color 0.3s, color 0.3s;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
}

.filter-button-playlists {
    transition: background-color 0.3s, color 0.3s;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
}

.play-all-button {
    transition: background-color 0.3s, color 0.3s;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
}
</style>
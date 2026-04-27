<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'
import Toastify from 'toastify-js'
import Swal from 'sweetalert2'
import type { PlaylistModel } from '@/domain/models/PlayListModel'
import type { PlaylistSongModel } from '@/domain/models/PlaylistSongModel'
import { getSongsFromPlaylist } from '@/domain/usecases/playlists/GetSongsFromPlaylist'
import { deleteSongFromPlaylist } from '@/domain/usecases/playlists/DeleteSongFromPlaylist'
import { deletePlaylist } from '@/domain/usecases/playlists/DeletePlayList'
import { usePlayerStore } from '@/stores/player-store'
import { useUserDataStore } from '@/stores/userDataStore'
import DownloadButton from '@/presentation/widgets/DownloadButton.vue'

const userDataStore = useUserDataStore()
const playerStore = usePlayerStore()

// Importar imagen de fondo
import musicBg from '@/assets/img/music.jpg'

// Usar datos del store (ya cargados en el layout)
const playlists = computed(() => userDataStore.playlists)
const loadingPlaylists = computed(() => userDataStore.loading.playlists)
const playlistSongCounts = computed(() => userDataStore.playlistSongCounts)
const IMAGE_PLAYLIST = musicBg

// Estado local
const songs = ref<PlaylistSongModel[]>([])
const currentPlaylistId = ref<string | null>(null)
const currentPlaylistName = ref<string>('')
const deletingMap = ref<Record<string, boolean>>({})
const playlistImages = ref<Record<string, string>>({})
const loadingSongs = ref(false)
const sortOption = ref<'recent' | 'alphabetical'>('recent')
const showAllPlaylists = ref(true)

// --- Optimización de Renderizado (Lazy Loading) ---
const displayLimit = ref(20)
const visibleSongs = computed(() => {
    return sortedSongs.value.slice(0, displayLimit.value)
})

const loadMore = (entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && displayLimit.value < songs.value.length) {
        displayLimit.value += 20
    }
}

let observer: IntersectionObserver | null = null
const setupObserver = () => {
    const sentinel = document.getElementById('songs-sentinel')
    if (sentinel) {
        if (observer) observer.disconnect()
        observer = new IntersectionObserver(loadMore, { threshold: 0.1 })
        observer.observe(sentinel)
    }
}
// --------------------------------------------------

const LOCAL_PLAYLIST_KEY = 'jearcast_selectedPlaylistId'
const PLAYLIST_IMAGES_KEY = 'jearcast_playlist_images'

// Determinar la imagen de la playlist actual para el Hero
const currentPlaylistImage = computed(() => {
    if (currentPlaylistId.value && playlistImages.value[currentPlaylistId.value]) {
        return playlistImages.value[currentPlaylistId.value]
    }
    return musicBg
})

// ==================== UTILIDADES ====================
const getUserId = (): string | null => {
    return userDataStore.getUserId()
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

// Comprimir imagen antes de guardar (Reducir a máximo 500px para ahorrar LocalStorage)
const compressAndSaveImage = (playlistId: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height
            const maxSide = 500

            if (width > height) {
                if (width > maxSide) {
                    height *= maxSide / width
                    width = maxSide
                }
            } else {
                if (height > maxSide) {
                    width *= maxSide / height
                    height = maxSide
                }
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(img, 0, 0, width, height)

            // Guardar con calidad reducida (0.7) para optimizar espacio
            const compressedData = canvas.toDataURL('image/jpeg', 0.7)
            savePlaylistImage(playlistId, compressedData)

            Toastify({
                text: 'Imagen optimizada y guardada',
                duration: 3000,
                className: 'toast-glass',
                gravity: 'top',
                position: 'right'
            }).showToast()
        }
        img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
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
            compressAndSaveImage(playlistId, file)
        }
    } catch (error) {
        console.error('Error al seleccionar imagen:', error)
    }
}

// ==================== PLAYLISTS ====================
async function refreshPlaylists() {
    await userDataStore.invalidateAndRefreshPlaylists()
    Toastify({
        text: 'Playlists actualizadas',
        duration: 3000,
        className: 'toast-glass',
        gravity: 'top',
        position: 'right'
    }).showToast()
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
    displayLimit.value = 20 // Reset limit
    localStorage.removeItem(LOCAL_PLAYLIST_KEY)
}

// ==================== CANCIONES ====================
async function loadSongs(playlistId: string, playlistName: string) {
    saveSelectedPlaylist(playlistId, playlistName)
    loadingSongs.value = true
    displayLimit.value = 20

    try {
        songs.value = await userDataStore.fetchSongsFromPlaylist(playlistId)
        setTimeout(() => setupObserver(), 100)
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

async function loadMoreFromFirebase() {
    if (!currentPlaylistId.value) return
    loadingSongs.value = true
    try {
        const newSongs = await userDataStore.loadMoreSongsFromPlaylist(currentPlaylistId.value)
        songs.value = [...songs.value, ...newSongs]
    } catch (e) {
        console.error(e)
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
    playerStore.setPlaylist(
        playlist,
        index,
        { type: 'playlist', id: currentPlaylistId.value! },
        userDataStore.hasMorePlaylistSongs
    )
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

        // Actualizar conteo en el store
        await userDataStore.updatePlaylistSongCount(currentPlaylistId.value)

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

            // Invalidar playlists en el store después de eliminar
            await userDataStore.invalidateAndRefreshPlaylists()

            // Actualizar vista local
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
// Actualizar conteo local cuando cambian las canciones
watch(songs, async (newSongs) => {
    if (currentPlaylistId.value) {
        await userDataStore.updatePlaylistSongCount(currentPlaylistId.value)
    }
}, { deep: true })

// ==================== LIFECYCLE ====================
onMounted(() => {
    loadPlaylistImages()

    const savedId = localStorage.getItem(LOCAL_PLAYLIST_KEY)
    if (savedId) {
        const savedPlaylist = playlists.value.find(p => p.id === savedId)
        if (savedPlaylist) {
            loadSongs(savedId, savedPlaylist.name)
        }
    }

    console.log('Playlists: usando datos del store (sin petición)')
})

onUnmounted(() => {
    if (observer) observer.disconnect()
})
</script>

<template>
    <DashboardLayout>
        <div class="container-fluid px-0">
            <!-- HERO SECTION CON IMAGEN DE FONDO DINÁMICA -->
            <div v-if="!showAllPlaylists" class="playlist-hero mb-4"
                :style="{ backgroundImage: `url(${currentPlaylistImage})` }">
                <div class="hero-overlay">
                    <div class="hero-content px-4">
                        <span class="badge bg-accent mb-2">Tu Playlist</span>
                        <h1 class="display-4 fw-bold text-white mb-2">{{ currentPlaylistName }}</h1>
                        <div class="d-flex align-items-center gap-3 text-white-50">
                            <span><i class="bi bi-music-note-beamed me-1"></i> {{ songs.length }} Canciones</span>
                        </div>
                        <div class="mt-4 d-flex gap-2">
                            <button @click="playAll" class="btn btn-accent rounded-pill px-4 py-2 fw-semibold">
                                <i class="bi bi-play-fill me-1"></i> Reproducir
                            </button>
                            <button @click="showAllPlaylistsView" class="btn btn-outline-light rounded-pill px-4">
                                <i class="bi bi-arrow-left me-1"></i> Volver
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- HEADER SECTION (Solo visible cuando se ven todas) -->
            <div v-if="showAllPlaylists" class="d-flex justify-content-between align-items-center mb-4 px-3">
                <div class="d-flex align-items-center gap-3">
                    <h4 class="text-white mb-0 fw-bold">Playlists</h4>
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
                    <button @click="refreshPlaylists" :disabled="loadingPlaylists"
                        class="btn btn-outline-light btn-sm rounded-pill px-3 refresh-button-playlists"
                        title="Refrescar">
                        <span v-if="loadingPlaylists" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-arrow-clockwise"></i>
                    </button>
                </div>
            </div>

            <!-- SECCIÓN DE PLAYLISTS - SOLO si showAllPlaylists es true -->
            <div v-if="showAllPlaylists" class="playlists-grid px-3 mb-4">
                <div v-for="playlist in playlists" :key="playlist.id" class="playlist-card-wrapper">
                    <div class="playlist-card" :class="{ 'active': currentPlaylistId === playlist.id }">

                        <!-- Imagen de fondo con overlay -->
                        <div class="playlist-image-wrapper" @click="loadSongs(playlist.id!, playlist.name)">
                            <img :src="playlistImages[playlist.id!] || IMAGE_PLAYLIST" :alt="playlist.name"
                                class="playlist-image" />

                            <div class="playlist-overlay">
                                <button class="play-button" @click.stop="loadSongs(playlist.id!, playlist.name)">
                                    <i class="bi bi-play-fill"></i>
                                </button>
                            </div>

                            <!-- Badge con cantidad de canciones-->
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

            <!-- LISTA DE CANCIONES -->
            <div v-if="songs.length > 0" class="mt-4 px-3">
                <!-- Header de la playlist seleccionada -->
                <div class="d-flex align-items-center gap-3 mb-3">
                    <h5 class="text-white mb-0">{{ currentPlaylistName }}</h5>
                    <span class="badge bg-secondary bg-opacity-25 text-white">
                        {{ songs.length }} {{ songs.length === 1 ? 'canción' : 'canciones' }}
                    </span>
                    <button @click="playAll"
                        class="btn btn-sm btn-outline-light rounded-pill px-3 play-all-button d-flex align-items-center gap-1">
                        <i class="bi bi-play-fill"></i>
                        <span class="d-none d-sm-inline">Reproducir todo</span>
                        <span class="d-inline d-sm-none">Todo</span>
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
                    <div v-for="(song, index) in visibleSongs" :key="song.video_id"
                        class="song-row row align-items-center p-2 mx-0 mb-1" @dblclick="playSong(index)">

                        <!-- Columna # / Play (Ocultar en móviles muy pequeños si es necesario) -->
                        <div class="col-1 d-none d-sm-flex text-secondary index-col text-center">
                            <span class="number">{{ index + 1 }}</span>
                            <i class="bi bi-play-fill play-icon text-white" @click="playSong(index)"></i>
                        </div>

                        <!-- Info canción (Más espacio en móviles) -->
                        <div class="col-9 col-sm-8 col-md-6 d-flex align-items-center gap-2 gap-sm-3">
                            <img :src="song.video_thumbnail" class="rounded shadow-sm flex-shrink-0"
                                style="width: 40px; height: 40px; width: 48px; height: 48px; object-fit: cover" />
                            <div class="text-truncate">
                                <h6 class="text-white mb-0 text-truncate fw-semibold"
                                    style="font-size: 0.85rem; font-size: 0.9rem;">
                                    {{ song.video_title }}
                                </h6>
                                <small class="text-secondary d-none d-sm-block" style="font-size: 11px;">JearCast
                                    Music</small>
                            </div>
                        </div>

                        <!-- Fecha (solo desktop) -->
                        <div class="col-3 d-none d-md-block text-secondary small text-center font-monospace">
                            {{ song.added_at?.toDate().toLocaleDateString() || 'Fecha desconocida' }}
                        </div>

                        <!-- Acciones (Más espacio para botones) -->
                        <div
                            class="col-3 col-sm-3 col-md-2 d-flex justify-content-end justify-content-md-center align-items-center gap-1">
                            <button @click="deleteSong(song.video_id)" class="btn btn-link p-0 remove-btn me-1">
                                <span v-if="deletingMap[song.video_id]"
                                    class="spinner-border spinner-border-sm text-secondary"></span>
                                <i v-else class="bi bi-trash3 text-secondary" style="font-size: 14px;"></i>
                            </button>
                            <DownloadButton :video-id="song.video_id" :title="song.video_title"
                                :thumbnail="song.video_thumbnail" />
                        </div>
                    </div>
                    <!-- Centinela para scroll infinito -->
                    <div id="songs-sentinel" style="height: 20px;"></div>

                    <!-- Botón Cargar Más de Firebase -->
                    <div v-if="userDataStore.hasMorePlaylistSongs && !showAllPlaylists" class="text-center py-4">
                        <button @click="loadMoreFromFirebase" :disabled="loadingSongs"
                            class="btn btn-outline-light rounded-pill px-5 btn-load-more">
                            <span v-if="loadingSongs" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="bi bi-plus-circle me-2"></i>
                            Cargar más canciones
                        </button>
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

/* ==================== HERO SECTION (music.jpg) ==================== */
.playlist-hero {
    height: 300px;
    background-size: cover;
    background-position: center;
    position: relative;
    border-bottom-left-radius: 1rem;
    border-bottom-right-radius: 1rem;
    overflow: hidden;
    margin-top: -1.5rem;
    transform: translateZ(0);
}

.playlist-hero::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: inherit;
    background-size: inherit;
    background-position: inherit;
    filter: blur(12px);
    /* Efecto blur suave */
    transform: scale(1.1);
    /* Evitar bordes blancos por el blur */
    z-index: 0;
    /* Radio mucho más grande para ocultar el borde mordido del contenedor */
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
            rgba(0, 0, 0, 0.1) 0%,
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

.btn-outline-light {
    background-color: transparent;
    border: 1px solid rgba(255, 255, 255, 0.4);
    color: white;
    transition: all 0.3s ease;
}

.btn-outline-light:hover {
    background-color: white;
    color: black;
    border-color: white;
    transform: translateY(-2px);
}

/* Ajuste para el botón volver específico */
.btn-outline-light.rounded-pill.px-4:hover {
    background-color: rgba(255, 255, 255, 0.9);
    color: #000;
}

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
</style>
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

const loadMore = async (entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting) {
        if (displayLimit.value < songs.value.length) {
            displayLimit.value += 20
        } else if (userDataStore.hasMorePlaylistSongs && !loadingSongs.value && currentPlaylistId.value) {
            console.log('Cargando más canciones automáticamente por scroll...')
            const newSongs = await userDataStore.loadMoreSongsFromPlaylist(currentPlaylistId.value)
            songs.value = [...songs.value, ...newSongs]
            displayLimit.value += 20
        }
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

// Slider dinámico de portadas por cada tarjeta de playlist
const cardSliderIndices = ref<Record<string, number>>({})
let cardSliderInterval: any = null

const startCardSlider = () => {
    if (cardSliderInterval) clearInterval(cardSliderInterval)
    cardSliderInterval = setInterval(() => {
        const thumbsMap = userDataStore.playlistThumbnails
        if (!thumbsMap) return
        for (const playlistId in thumbsMap) {
            // Solo rotar si no tiene imagen fija de cámara
            if (!playlistImages.value[playlistId]) {
                const list = thumbsMap[playlistId]
                if (list && list.length > 1) {
                    const current = cardSliderIndices.value[playlistId] || 0
                    cardSliderIndices.value[playlistId] = (current + 1) % list.length
                }
            }
        }
    }, 3500)
}

const getPlaylistCover = (playlistId: string): string => {
    if (playlistId && playlistImages.value[playlistId]) {
        return playlistImages.value[playlistId]
    }
    const thumbs = userDataStore.playlistThumbnails[playlistId]
    if (thumbs && thumbs.length > 0) {
        const idx = cardSliderIndices.value[playlistId] || 0
        return thumbs[idx % thumbs.length]
    }
    return IMAGE_PLAYLIST
}

// Determinar la imagen de la playlist actual para el Hero
const currentPlaylistImage = computed(() => {
    if (currentPlaylistId.value) {
        if (playlistImages.value[currentPlaylistId.value]) {
            return playlistImages.value[currentPlaylistId.value]
        }
        const thumbs = userDataStore.playlistThumbnails[currentPlaylistId.value]
        if (thumbs && thumbs.length > 0) {
            return thumbs[0]
        }
        if (songs.value.length > 0 && songs.value[0].video_thumbnail) {
            return songs.value[0].video_thumbnail
        }
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
    startCardSlider()

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
    if (cardSliderInterval) clearInterval(cardSliderInterval)
    if (observer) observer.disconnect()
})
</script>

<template>
    <DashboardLayout>
        <div class="container-fluid px-0">
            <!-- HERO SECTION CON IMAGEN DE FONDO DINÁMICA -->
            <div v-if="!showAllPlaylists" class="playlist-hero mb-4">
                <div class="hero-bg-layer" :style="{ backgroundImage: `url(${currentPlaylistImage})` }"></div>
                <div class="hero-overlay">
                    <div class="hero-content px-4">
                        <!--<span class="badge bg-accent mb-2">Tu Playlist</span>-->
                        <h1 class="display-4 fw-bold text-white mb-2">{{ currentPlaylistName }}</h1>
                        <div class="d-flex align-items-center gap-3 text-white-50">
                            <span><i class="bi bi-music-note-beamed me-1"></i> {{ songs.length }} Canciones</span>
                        </div>
                        <div class="mt-4 d-flex align-items-center gap-2">
                            <button @click="playAll" class="btn btn-accent rounded-pill px-4 py-2 fw-semibold">
                                <i class="bi bi-play-fill me-1"></i> Reproducir
                            </button>
                            <button @click="showAllPlaylistsView" class="btn-hero-back" title="Volver a playlists">
                                <i class="bi bi-arrow-left fs-5"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- HEADER SECTION (Solo visible cuando se ven todas) -->
            <div v-if="showAllPlaylists" class="d-flex justify-content-between align-items-center mb-4 px-3">
                <div class="d-flex align-items-center gap-3">
                    <h4 class="mb-0 fw-bold">Playlists</h4>
                </div>

                <div class="d-flex gap-2">
                    <!-- Selector de orden (solo visible cuando hay canciones) -->
                    <button v-if="songs.length > 0" @click="toggleSortOption"
                        class="btn-modern-action">
                        <i :class="sortOption === 'recent' ? 'bi bi-clock-history' : 'bi bi-sort-alpha-down'"></i>
                        <span>{{ sortOption === 'recent' ? 'Recientes' : 'A-Z' }}</span>
                    </button>

                    <!-- Botón recargar playlists -->
                    <button @click="refreshPlaylists" :disabled="loadingPlaylists"
                        class="btn-modern-action"
                        title="Sincronizar tus playlists">
                        <i :class="['bi bi-arrow-clockwise', loadingPlaylists ? 'spin-animation' : '']"></i>
                        <span>Sincronizar</span>
                    </button>
                </div>
            </div>

            <!-- SECCIÓN DE PLAYLISTS - SOLO si showAllPlaylists es true -->
            <div v-if="showAllPlaylists" class="playlists-grid px-3 mb-4">
                <div v-for="playlist in playlists" :key="playlist.id" class="playlist-card-wrapper">
                    <!-- 3 Capas traseras apiladas visibles al ingresar (carta sobre carta) -->
                    <div class="playlist-card-layer playlist-card-layer-3"></div>
                    <div class="playlist-card-layer playlist-card-layer-2"></div>
                    <div class="playlist-card-layer playlist-card-layer-1"></div>

                    <div class="playlist-card" :class="{ 'active': currentPlaylistId === playlist.id }"
                        @click="loadSongs(playlist.id!, playlist.name)">

                        <!-- Imagen de fondo con overlay -->
                        <div class="playlist-image-wrapper">
                            <img :src="getPlaylistCover(playlist.id!)" :alt="playlist.name"
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

                            <!-- Botón eliminar playlist -->
                            <button class="delete-playlist-btn" @click.stop="confirmDeletePlaylist(playlist.id!)" title="Eliminar playlist">
                                <i class="bi bi-trash3"></i>
                            </button>
                        </div>

                        <!-- Información de la playlist (exactamente igual que en topics) -->
                        <div class="playlist-info">
                            <h6 class="playlist-name" :title="playlist.name">{{ playlist.name }}</h6>
                            <p class="playlist-description">{{ playlistSongCounts[playlist.id!] || 0 }} {{ (playlistSongCounts[playlist.id!] || 0) === 1 ? 'canción' : 'canciones' }}</p>
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

:deep(.playlists-grid),
.playlists-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)) !important;
    gap: 1.5rem 1.25rem !important;
}

@media (min-width: 768px) {
    :deep(.playlists-grid),
    .playlists-grid {
        grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)) !important;
    }
}

/* ==================== CAPAS TRASERAS APILADAS (CARTA SOBRE CARTA) ==================== */
.playlist-card-wrapper {
    position: relative;
    padding-top: 14px;
    padding-right: 14px;
    cursor: pointer;
    user-select: none;
    z-index: 1;
}

.playlist-card-wrapper:hover {
    z-index: 15;
}

.playlist-card-layer {
    position: absolute;
    border-radius: 0.8rem;
    width: calc(100% - 14px);
    aspect-ratio: 1 / 1;
    pointer-events: none;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Capa 3: La más profunda (4ta carta) - Visible de inmediato al ingresar */
.playlist-card-layer-3 {
    top: 0px;
    right: 0px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    z-index: 0;
    transform: scale(0.93);
}

/* Capa 2: Intermedia (3ra carta) - Visible de inmediato al ingresar */
.playlist-card-layer-2 {
    top: 6px;
    right: 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 1;
    transform: scale(0.96);
}

/* Capa 1: Justo detrás de la principal (2da carta) - Visible de inmediato al ingresar */
.playlist-card-layer-1 {
    top: 10px;
    right: 10px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 2;
    transform: scale(0.985);
}

/* Hover: Capas se abren suavemente sin desarmar las filas */
.playlist-card-wrapper:hover .playlist-card-layer-3 {
    top: -3px;
    right: -3px;
    background: rgba(255, 255, 255, 0.05);
}

.playlist-card-wrapper:hover .playlist-card-layer-2 {
    top: 3px;
    right: 3px;
    background: rgba(255, 255, 255, 0.08);
}

.playlist-card-wrapper:hover .playlist-card-layer-1 {
    top: 8px;
    right: 8px;
    background: rgba(255, 255, 255, 0.12);
}

.playlist-card {
    cursor: pointer;
    background: transparent;
    border-radius: 0.8rem;
    position: relative;
    z-index: 3;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
}

.playlist-card.active .playlist-image-wrapper {
    box-shadow: 0 0 0 2px var(--accent-color);
}

/* ==================== IMAGEN DE LA PLAYLIST ==================== */
.playlist-image-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 1/1;
    border-radius: 0.8rem;
    background: #1a1a1a;
    margin-bottom: 0.75rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 2;
    overflow: hidden;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    transform: translateZ(0);
}

.playlist-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 0.8rem;
    filter: none;
    transition: transform 0.4s ease;
}

/* ZOOM EN LA IMAGEN AL PASAR EL MOUSE (IGUAL QUE EN TOPICS) */
.playlist-card:hover .playlist-image {
    transform: scale(1.08);
}

/* ==================== OVERLAY CON BLUR Y BOTÓN PLAY ==================== */
.playlist-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    opacity: 0;
    border-radius: 0.8rem !important;
    transition: opacity 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.playlist-card:hover .playlist-overlay {
    opacity: 1;
}

.play-button {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: var(--accent-color);
    color: white;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s ease, background 0.2s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.play-button:hover {
    transform: scale(1.1);
    color: #ffffff;
}

/* ==================== BADGE DE CONTEO ==================== */
.song-count-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    color: white;
    padding: 4px 8px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    z-index: 2;
}

.delete-playlist-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 3;
    opacity: 0;
}

.playlist-card:hover .delete-playlist-btn {
    opacity: 1;
}

.delete-playlist-btn:hover {
    background: rgba(220, 53, 69, 0.85);
    border-color: rgba(220, 53, 69, 1);
    color: #ffffff;
    transform: scale(1.1);
}

/* ==================== INFORMACIÓN DE LA PLAYLIST (IGUAL QUE EN TOPICS) ==================== */
.playlist-info {
    padding: 0 0.25rem;
}

.playlist-name {
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.playlist-description {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 0;
}

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

.btn-hero-back {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1.5px solid transparent;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    outline: none;
    padding: 0;
}

.btn-hero-back:hover {
    background: rgba(255, 255, 255, 0.28);
    border-color: rgba(255, 255, 255, 0.75);
    color: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.35), 0 0 10px rgba(255, 255, 255, 0.25);
}

.btn-hero-back:active {
    transform: translateY(0);
    background: rgba(255, 255, 255, 0.2);
}

/* ==================== HERO SECTION (music.jpg) ==================== */
.playlist-hero {
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
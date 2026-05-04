<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { RecommendedPlaylistModel } from '@/domain/models/RecommendedPlaylistModel'
import type { RecommendedSongModel } from '@/domain/models/RecommendedSongModel'
import { fetchRecommendedPlaylistsService, fetchSongsFromRecommendedPlaylistService } from '@/data/services/firestore/RecommendedPlaylistFirestore'
import { usePlayerStore } from '@/stores/player-store'
import { useUserDataStore } from '@/stores/userDataStore'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'
import DownloadButton from '@/presentation/widgets/DownloadButton.vue'

const playlists = ref<RecommendedPlaylistModel[]>([])
const songs = ref<RecommendedSongModel[]>([])
const currentPlaylistId = ref<string | null>(null)
const currentPlaylistName = ref<string>('')
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
        } else if (userDataStore.hasMoreRecommendedSongs && !loadingSongs.value && currentPlaylistId.value) {
            console.log('Cargando más recomendados automáticamente por scroll...')
            const newSongs = await userDataStore.loadMoreSongsFromRecommended(currentPlaylistId.value)
            songs.value = [...songs.value, ...newSongs]
            displayLimit.value += 20
        }
    }
}

let observer: IntersectionObserver | null = null
const setupObserver = () => {
    const sentinel = document.getElementById('songs-sentinel-recommended')
    if (sentinel) {
        if (observer) observer.disconnect()
        observer = new IntersectionObserver(loadMore, { threshold: 0.1 })
        observer.observe(sentinel)
    }
}
// --------------------------------------------------

const LOCAL_RECOMMENDED_KEY = 'lastRecommendedPlaylistId'

// Importar imagen de fondo
import musicBg from '@/assets/img/music.jpg'

// ==================== UTILIDADES ====================
const getLastRecommendedPlaylistId = (): string | null => {
    return localStorage.getItem(LOCAL_RECOMMENDED_KEY)
}

const saveRecommendedPlaylistId = (playlistId: string, playlistName: string) => {
    currentPlaylistId.value = playlistId
    currentPlaylistName.value = playlistName
    showAllPlaylists.value = false
    localStorage.setItem(LOCAL_RECOMMENDED_KEY, playlistId)
}

const showAllPlaylistsView = () => {
    currentPlaylistId.value = null
    currentPlaylistName.value = ''
    showAllPlaylists.value = true
    songs.value = []
    displayLimit.value = 20
    localStorage.removeItem(LOCAL_RECOMMENDED_KEY)
}

const playerStore = usePlayerStore()
const userDataStore = useUserDataStore()

// ==================== CANCIONES ====================
const loadSongs = async (playlistId: string, playlistName: string) => {
    saveRecommendedPlaylistId(playlistId, playlistName)
    loadingSongs.value = true
    displayLimit.value = 20

    try {
        songs.value = await userDataStore.fetchSongsFromRecommended(playlistId)
        setTimeout(() => setupObserver(), 100)
    } catch (error) {
        console.error('Error cargando canciones:', error)
    } finally {
        loadingSongs.value = false
    }
}

const loadMoreFromFirebase = async () => {
    if (!currentPlaylistId.value) return
    loadingSongs.value = true
    try {
        const newSongs = await userDataStore.loadMoreSongsFromRecommended(currentPlaylistId.value)
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
            // Si no hay fecha, usar orden original
            return 0
        })
    } else {
        return [...songs.value].sort((a, b) => {
            return a.video_title.localeCompare(b.video_title)
        })
    }
})

const toggleSortOption = () => {
    sortOption.value = sortOption.value === 'recent' ? 'alphabetical' : 'recent'
}

// ==================== REPRODUCCIÓN ====================
const playSong = (index: number) => {
    const playlist = sortedSongs.value.map(song => ({
        video_id: song.video_id,
        video_title: song.video_title,
        video_thumbnail: song.video_thumbnail
    }))
    playerStore.setPlaylist(
        playlist,
        index,
        { type: 'recommended', id: currentPlaylistId.value! },
        userDataStore.hasMoreRecommendedSongs
    )
}

const playAll = () => {
    if (visibleSongs.value.length > 0) {
        playSong(0)
    }
}

// ==================== LIFECYCLE ====================
onMounted(async () => {
    playlists.value = await fetchRecommendedPlaylistsService()

    const lastPlaylistId = getLastRecommendedPlaylistId()
    if (lastPlaylistId) {
        const savedPlaylist = playlists.value.find(p => p.id === lastPlaylistId)
        if (savedPlaylist) {
            await loadSongs(lastPlaylistId, savedPlaylist.name.replace(/_/g, ' '))
        }
    }
})

onUnmounted(() => {
    if (observer) observer.disconnect()
})
</script>

<template>
    <DashboardLayout>
        <div class="container-fluid px-0">
            <!-- HERO SECTION CON IMAGEN DE FONDO (music.jpg) -->
            <div v-if="!showAllPlaylists" class="recommended-hero mb-4" :style="{ backgroundImage: `url(${musicBg})` }">
                <div class="hero-overlay">
                    <div class="hero-content px-4">
                        <span class="badge bg-accent mb-2">Playlist Recomendada</span>
                        <h1 class="display-4 fw-bold text-white mb-2">{{ currentPlaylistName }}</h1>
                        <div class="d-flex align-items-center gap-3 text-white-50">
                            <span><i class="bi bi-music-note-beamed me-1"></i> {{ songs.length }} Canciones</span>
                        </div>
                        <div class="mt-4 d-flex gap-2">
                            <button @click="playAll" class="btn btn-accent rounded-pill px-4 py-2 fw-bold">
                                <i class="bi bi-play-fill me-1"></i> Reproducir
                            </button>
                            <button @click="showAllPlaylistsView" class="btn btn-outline-light rounded-pill px-4">
                                <i class="bi bi-arrow-left me-1"></i> Volver
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- HEADER con título y controles (Solo se muestra cuando se ven todas las playlists) -->
            <div v-if="showAllPlaylists" class="d-flex justify-content-between align-items-center mb-4 px-3">
                <div class="d-flex align-items-center gap-3">
                    <h4 class="mb-0 fw-bold" style="color: rgba(255, 255, 255, 0.7);">Recomendados</h4>
                </div>

                <div class="d-flex gap-2">
                    <!-- Selector de orden (solo visible cuando hay canciones) -->
                    <button v-if="songs.length > 0" @click="toggleSortOption"
                        class="btn btn-dark btn-sm border-secondary rounded-pill px-3"
                        style="background-color: transparent;">
                        <i :class="sortOption === 'recent' ? 'bi bi-clock-history' : 'bi bi-sort-alpha-down'"
                            class="me-1" />
                        {{ sortOption === 'recent' ? 'Recientes' : 'A-Z' }}
                    </button>
                </div>
            </div>

            <!-- SECCIÓN DE PLAYLISTS RECOMENDADAS (cards cuadradas) -->
            <div v-if="showAllPlaylists" class="playlists-grid px-3 mb-4">
                <div v-for="playlist in playlists" :key="playlist.id" class="playlist-card-wrapper">
                    <div class="playlist-card" :class="{ 'active': currentPlaylistId === playlist.id }"
                        @click="loadSongs(playlist.id, playlist.name.replace(/_/g, ' '))">

                        <!-- Imagen de fondo con overlay -->
                        <div class="playlist-image-wrapper">
                            <!-- Imagen de la playlist local -->
                            <img :src="musicBg" :alt="playlist.name" class="playlist-image" />

                            <!-- Overlay con blur y botón play -->
                            <div class="playlist-overlay">
                                <button class="play-button"
                                    @click.stop="loadSongs(playlist.id, playlist.name.replace(/_/g, ' '))">
                                    <i class="bi bi-play-fill"></i>
                                </button>
                            </div>

                            <!-- Badge con número de canciones (simulado) -->
                            <span class="song-count-badge">
                                <i class="bi bi-music-note-beamed me-1"></i>
                                12
                            </span>
                        </div>

                        <!-- Información de la playlist -->
                        <div class="playlist-info">
                            <h6 class="playlist-name">{{ playlist.name.replace(/_/g, ' ') }}</h6>
                            <p class="playlist-description">Playlist recomendada</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CONTENEDOR DEL PLAYER -->
            <div class="text-white rounded shadow mt-4 container-player-jear" id="player-recommended-container"></div>

            <!-- LISTA DE CANCIONES (estilo favoritos/playlists) -->
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
                    <div class="col-9 col-md-8">Título</div>
                    <div class="col-2 text-center">Acciones</div>
                </div>

                <!-- Lista de canciones -->
                <div class="px-0">
                    <div v-for="(song, index) in visibleSongs" :key="song.video_id"
                        class="song-row row align-items-center p-2 mx-0 mb-1" @dblclick="playSong(index)">

                        <!-- Columna # / Play -->
                        <div class="col-1 d-none d-sm-flex text-secondary index-col text-center">
                            <span class="number">{{ index + 1 }}</span>
                            <i class="bi bi-play-fill play-icon text-white" @click="playSong(index)"></i>
                        </div>

                        <!-- Info canción -->
                        <div class="col-9 col-sm-8 col-md-8 d-flex align-items-center gap-2 gap-sm-3">
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

                        <!-- Acciones -->
                        <div
                            class="col-3 col-sm-3 col-md-2 d-flex justify-content-end justify-content-md-center align-items-center gap-1">
                            <button @click="playSong(index)" class="btn btn-link p-0 play-action-btn me-2"
                                title="Reproducir">
                                <i class="bi bi-play-circle-fill"
                                    style="font-size: 1.15rem; color: var(--accent-color) !important"></i>
                            </button>
                            <DownloadButton :video-id="song.video_id" :title="song.video_title"
                                :thumbnail="song.video_thumbnail" />
                        </div>
                    </div>
                    <!-- Centinela para scroll infinito -->
                    <div id="songs-sentinel-recommended" style="height: 20px;"></div>

                    <!-- Botón Cargar Más de Firebase -->
                    <div v-if="userDataStore.hasMoreRecommendedSongs && !showAllPlaylists" class="text-center py-4">
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
                <p>No hay playlists recomendadas disponibles.</p>
            </div>

            <div v-else-if="!showAllPlaylists && songs.length === 0" class="text-white-50 p-4 text-center">
                <i class="bi bi-music-note-beamed fs-1 d-block mb-3"></i>
                <p>Esta playlist no tiene canciones aún.</p>
            </div>
        </div>
    </DashboardLayout>
</template>

<style scoped>
/* ==================== HERO SECTION (music.jpg) ==================== */
.recommended-hero {
    height: 300px;
    background-size: cover;
    background-position: center;
    position: relative;
    overflow: hidden;
    margin-top: -1.5rem;
    transform: translateZ(0);
}

.hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* Aplicando el mismo efecto blur que el HeaderLeft (modo celular) */
    background: rgba(0, 0, 0, 0.4); 
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
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

.play-all-button {
    transition: background-color 0.3s, color 0.3s;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
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

/* ==================== PLAYLISTS GRID (CARDS CUADRADAS) ==================== */
.playlists-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

@media (min-width: 768px) {
    .playlists-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
}

.btn-ver-todas {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
}

.playlist-card-wrapper {
    transition: transform 0.2s ease;
}

.playlist-card-wrapper:hover {
    transform: translateY(-4px);
}

.playlist-card {
    cursor: pointer;
    background: transparent;
    border-radius: 0.5rem;
    overflow: hidden;
    transition: all 0.2s ease;
}

.playlist-card.active .playlist-image-wrapper {
    box-shadow: 0 0 0 2px #737373;
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

/* Efecto de tarjetas apiladas (Perspectiva 3D fija) */
.playlist-card-wrapper {
    position: relative;
    padding-top: 14px;
    padding-right: 14px;
    transition: transform 0.4s ease;
}

/* Capas traseras siempre visibles */
.playlist-card-wrapper::before,
.playlist-card-wrapper::after {
    content: "";
    position: absolute;
    border-radius: 0.8rem;
    z-index: 0;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    width: calc(100% - 14px);
    aspect-ratio: 1/1;
}

/* Tarjeta más lejana (ya visible) */
.playlist-card-wrapper::after {
    top: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.04);
    z-index: -2;
    transform: scale(0.96);
}

/* Tarjeta intermedia (ya visible) */
.playlist-card-wrapper::before {
    top: 7px;
    right: 7px;
    background: rgba(255, 255, 255, 0.08);
    z-index: -1;
    transform: scale(0.98);
}

/* Hover: Se expanden más hacia afuera */
.playlist-card-wrapper:hover {
    transform: translate(-4px, 4px);
}

.playlist-card-wrapper:hover::after {
    top: -8px;
    right: -8px;
    background: rgba(255, 255, 255, 0.07);
}

.playlist-card-wrapper:hover::before {
    top: -2px;
    right: -2px;
    background: rgba(255, 255, 255, 0.12);
}

.playlist-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 0.8rem;
    transition: transform 0.4s ease;
}

.playlist-card:hover .playlist-image {
    transform: scale(1.05);
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

/* ==================== INFORMACIÓN DE LA PLAYLIST ==================== */
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

/* ==================== ESTILOS DE CANCIONES ==================== */
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

.play-action-btn {
    transition: all 0.2s ease;
    opacity: 0.7;
}

.play-action-btn:hover {
    opacity: 1;
    transform: scale(1.1);
    color: #ffffff
}

.play-action-btn i {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    color: #ffffff
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 767px) {
    .playlists-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 1rem;
    }

    .play-button {
        width: 36px;
        height: 36px;
        font-size: 1.2rem;
    }

    .song-row {
        font-size: 0.9rem;
    }

    .song-row img {
        width: 40px;
        height: 40px;
    }

    .play-action-btn i {
        font-size: 1.3rem !important;
    }
}

@media (max-width: 575px) {
    .playlists-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .playlist-name {
        font-size: 0.8rem;
    }

    .playlist-description {
        font-size: 0.7rem;
    }
}

/* ==================== ANIMACIONES ==================== */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.playlist-card {
    animation: fadeIn 0.3s ease;
}
</style>
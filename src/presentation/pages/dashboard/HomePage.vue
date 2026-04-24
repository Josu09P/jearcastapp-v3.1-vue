<template>
    <DashboardLayout>
        <section class="container-fluid px-0">
            <!-- SECCIÓN MIXWIDGET -->
            <MixWidget ref="mixWidget" />
            <br>

            <!-- Tarjetas de estadísticas -->
            <div class="stats-grid">
                <!-- Favoritos -->
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="bi bi-heart-fill text-danger"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Favoritos</span>
                        <span class="stat-value">{{ totalFavorites }}</span>
                    </div>
                </div>

                <!-- Playlists -->
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="bi bi-music-note-list text-primary"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Playlists</span>
                        <span class="stat-value">{{ totalPlaylists }}</span>
                    </div>
                </div>

                <!-- Recomendados -->
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="bi bi-stars text-warning"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Recomendados</span>
                        <span class="stat-value">{{ totalRecommended }}</span>
                    </div>
                </div>
            </div>

            <!-- Historial de reproducción -->
            <div class="history-section mt-5">
                <div class="section-header">
                    <div>
                        <h5 class="section-title">
                            <i class="bi bi-clock-history me-2"></i> Historial
                        </h5>
                        <p class="section-subtitle">Tus últimas reproducciones</p>
                    </div>
                    <div class="header-actions">
                        <button @click="refreshRecentlyPlayed" :disabled="loading" class="icon-btn">
                            <i :class="['bi', loading ? 'bi-arrow-repeat spin-animation' : 'bi-arrow-clockwise']"></i>
                        </button>
                        <button @click="clearRecentlyPlayed" class="icon-btn text-danger">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </div>
                </div>

                <div v-if="recentlyPlayed.length" class="history-list">
                    <div v-for="(video, index) in recentlyPlayed" :key="video.video_id" class="history-item">
                        <div class="item-main" @click="playVideo(index)">
                            <img :src="video.video_thumbnail" class="item-thumbnail">
                            <span class="item-title">{{ video.video_title }}</span>
                        </div>
                        <div class="item-actions">
                            <button @click.stop="addToFavorites(video)" class="action-btn small">
                                <i class="bi bi-heart"></i>
                            </button>
                            <button @click.stop="openPlaylistModal(video)" class="action-btn small">
                                <i class="bi bi-plus-lg"></i>
                            </button>
                            <DownloadButton :video-id="video.video_id" :title="video.video_title"
                                :thumbnail="video.video_thumbnail" />
                        </div>
                    </div>
                </div>

                <div v-else class="empty-history">
                    <i class="bi bi-music-note-beamed"></i>
                    <p>No hay reproducciones recientes</p>
                </div>
            </div>

            <!-- Modal de playlists -->
            <div v-if="showPlaylistModal" class="modal-backdrop" @click.self="showPlaylistModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="text-white mb-0">Agregar a playlist</h5>
                        <button class="btn-close btn-close-white" @click="showPlaylistModal = false"></button>
                    </div>
                    <div class="modal-body">
                        <div v-if="playlists.length > 0" class="mb-3">
                            <select v-model="selectedPlaylistId" class="form-select">
                                <option disabled value="">Selecciona una playlist</option>
                                <option v-for="p in playlists" :key="p.id" :value="p.id">{{ p.name }}</option>
                            </select>
                            <button class="btn btn-outline-light w-100 mt-2" @click="addToPlaylist">
                                Agregar
                            </button>
                        </div>
                        <div>
                            <input v-model="newPlaylistName" type="text" class="form-control mb-2"
                                placeholder="Nueva playlist...">
                            <button class="btn btn-outline-light w-100" @click="createNewPlaylist">
                                Crear y agregar
                            </button>
                        </div>
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
import Toastify from 'toastify-js'
import type { PlaylistModel } from '@/domain/models/PlayListModel'
import { addFavoriteMusic } from '@/domain/usecases/favorites/AddFavoriteMusic'
import { songExistsInPlaylist } from '@/domain/usecases/playlists/SongExistsInPlaylist'
import { addSongToPlaylistService } from '@/data/services/firestore/PlaylistsFirestore'
import { createOrGetPlaylist } from '@/domain/usecases/playlists/CreateOrGetPlaylist'
import Swal from 'sweetalert2'
import MixWidget from '@/presentation/widgets/recomendations/MixWidget.vue'
import DownloadButton from '@/presentation/widgets/DownloadButton.vue'

const playerStore = usePlayerStore()
const userStore = useUserStore()
const totalFavorites = ref(0)
const totalPlaylists = ref(0)
const totalRecommended = ref(0)
const recentlyPlayed = ref<any[]>([])
const isProcessing = ref(false)
const playlists = ref<PlaylistModel[]>([])
const loading = ref(false)
const selectedPlaylistId = ref('')
const newPlaylistName = ref('')
const showPlaylistModal = ref(false)
const selectedVideo = ref<any | null>(null)
const addingFavoritesMap = ref<Record<string, boolean>>({})
const loadingPlaylists = ref(false)
const mixWidget = ref()

const playVideo = (index: number) => {
    if (!recentlyPlayed.value.length) return
    const playlist = recentlyPlayed.value.map(video => ({
        video_id: video.video_id,
        video_title: video.video_title,
        video_thumbnail: video.video_thumbnail
    }))
    playerStore.setPlaylist(playlist, index)
}

const clearRecentlyPlayed = async () => {
    const result = await Swal.fire({
        title: '¿Eliminar historial?',
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
        localStorage.removeItem('recentlyPlayed')
        recentlyPlayed.value = []
        Toastify({
            text: 'Historial eliminado',
            duration: 2000,
            gravity: 'top',
            position: 'right',
            className: 'toast-glass bg-danger'
        }).showToast()
    }
}

const showToast = (text: string) => {
    Toastify({
        text,
        duration: 2000,
        gravity: 'top',
        position: 'right',
        className: 'toast-glass'
    }).showToast()
}

const refreshRecentlyPlayed = () => {
    loading.value = true
    setTimeout(() => {
        const stored = localStorage.getItem('recentlyPlayed')
        recentlyPlayed.value = stored ? JSON.parse(stored) : []
        showToast('Historial actualizado')
        loading.value = false
    }, 500)
}

const refreshPlaylists = async () => {
    if (!userStore.id) return
    loadingPlaylists.value = true
    playlists.value = await getPlaylistsByUser(userStore.id)
    showToast('Playlists actualizadas')
    setTimeout(() => {
        loadingPlaylists.value = false
    }, 500)
}

const addToFavorites = async (video: any) => {
    if (!userStore.id || addingFavoritesMap.value[video.videoId]) return

    addingFavoritesMap.value[video.videoId] = true
    const videoId = video.video_id || video.videoId
    const videoTitle = video.video_title || video.title
    const videoThumbnail = video.video_thumbnail || video.thumbnail

    const result = await addFavoriteMusic({
        user_id: userStore.id,
        video_id: videoId,
        video_title: videoTitle,
        video_thumbnail: videoThumbnail
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

onMounted(async () => {
    const userId = userStore.id
    if (!userId) return

    const [favorites, playlistsData, recommended] = await Promise.all([
        getFavoritesByUser(userId),
        getPlaylistsByUser(userId),
        getRecommendedPlaylists()
    ])

    totalFavorites.value = favorites.favorites.length
    totalPlaylists.value = playlistsData.length
    totalRecommended.value = recommended.length
    playlists.value = playlistsData

    const stored = localStorage.getItem('recentlyPlayed')
    if (stored) {
        recentlyPlayed.value = JSON.parse(stored)
    }

    if (!userStore.id) {
        userStore.loadUserFromLocalStorage()
    }
})

const addToPlaylist = async () => {
    if (isProcessing.value) return
    if (!userStore.id || !selectedVideo.value || !selectedPlaylistId.value) {
        return showToast('Faltan datos')
    }

    isProcessing.value = true
    try {
        const exists = await songExistsInPlaylist(selectedPlaylistId.value, selectedVideo.value.videoId)
        if (exists) {
            return showToast('La canción ya existe')
        }
        await addSongToPlaylistService(selectedPlaylistId.value, {
            video_id: selectedVideo.value.videoId,
            video_title: selectedVideo.value.title,
            video_thumbnail: selectedVideo.value.thumbnail
        })
        showToast('Agregado a la playlist')
        showPlaylistModal.value = false
    } catch (error) {
        showToast('Error al agregar')
    } finally {
        isProcessing.value = false
    }
}

const createNewPlaylist = async () => {
    if (isProcessing.value) return
    if (!newPlaylistName.value || !userStore.id) return showToast('Nombre no válido')

    isProcessing.value = true
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

<style scoped>
/* Stats minimalistas */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    max-width: 600px;
    margin: 0 auto;
}

.stat-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.2s ease;
}

.stat-card:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
}

.stat-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
}

.stat-icon i {
    font-size: 1.2rem;
    color: var(--accent-color) !important;
}

.stat-info {
    display: flex;
    flex-direction: column;
}

.stat-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 300;
    color: white;
    line-height: 1;
}

/* Secciones */
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.section-title {
    color: white;
    font-size: 1.1rem;
    font-weight: 400;
    margin: 0;
    display: flex;
    align-items: center;
}

.section-subtitle {
    color: rgba(255, 255, 255, 0.3);
    font-size: 0.8rem;
    margin: 0.25rem 0 0 0;
}

/* Lista de historial */
.history-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.history-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    background: rgba(51, 51, 51, 0.275);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    transition: all 0.2s ease;
}

.history-item:hover {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.1);
}

.item-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    flex: 1;
    min-width: 0;
}

.item-thumbnail {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    object-fit: cover;
}

.item-title {
    color: white;
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.item-actions {
    display: flex;
    gap: 0.25rem;
}

/* Botones */
.action-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.3);
    width: 28px;
    height: 28px;
    border-radius: 1.3rem !important;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-btn.small {
    width: 24px;
    height: 24px;
}

.action-btn:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
}

.action-btn.small i {
    font-size: 0.8rem;
}

.icon-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    width: 32px;
    height: 32px;
    border-radius: 1.3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.icon-btn:hover {
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
}

/* Estados vacíos */
.empty-history {
    text-align: center;
    padding: 3rem;
    background: rgba(80, 80, 80, 0.099);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.3);
}

.empty-history i {
    font-size: 2rem;
    margin-bottom: 1rem;
    opacity: 0.3;
}

.empty-history p {
    font-size: 0.9rem;
    margin: 0;
}

/* Modal */
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(5px);
    background: rgba(0, 0, 0, 0.5);
    z-index: 1040;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-content {
    background: rgba(20, 20, 20, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    width: 90%;
    max-width: 400px;
    overflow: hidden;
}

.modal-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-body {
    padding: 1.5rem;
}

.form-select,
.form-control {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 8px;
}

.form-select:focus,
.form-control:focus {
    outline: none;
    border-color: #1db954;
    box-shadow: none;
}

.form-select option {
    background: #1a1a1a;
}

/* Animaciones */
.spin-animation {
    animation: spin 1s linear infinite;
}

.header-actions {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    align-items: center;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: 1fr;
        max-width: 100%;
        gap: 0.75rem;
    }

    .stat-card {
        padding: 1rem 1.5rem;
        justify-content: space-between; /* Separa el icono de la info para llenar el espacio */
    }

    .stat-info {
        text-align: right; /* Alinea el texto a la derecha para equilibrar con el icono a la izquierda */
    }

    .stat-value {
        font-size: 1.4rem;
    }
}

@media (max-width: 480px) {
    .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }

    .header-actions {
        flex-direction: row;
        width: auto;
    }

    .item-title {
        max-width: 150px;
    }
}
</style>
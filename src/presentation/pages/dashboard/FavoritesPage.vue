<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'
import { useUserDataStore } from '@/stores/userDataStore'
import { removeFavoriteMusic } from '@/domain/usecases/favorites/RemoveFavoriteMusic'
import Toastify from 'toastify-js'
import { usePlayerStore } from '@/stores/player-store'
import DownloadButton from '@/presentation/widgets/DownloadButton.vue'

const userDataStore = useUserDataStore()
const playerStore = usePlayerStore()
const sortOption = ref<'recent' | 'alphabetical'>('recent')
const deletingMap = ref<Record<string, boolean>>({})

// Usar datos del store
const favorites = computed(() => userDataStore.favorites)
const loading = computed(() => userDataStore.loading.favorites)

// Ordenar favoritos
const sortedFavorites = computed(() => {
    if (sortOption.value === 'recent') {
        return [...favorites.value].sort((a, b) => {
            return (b.created_at?.toDate()?.getTime() || 0) - (a.created_at?.toDate()?.getTime() || 0)
        })
    } else {
        return [...favorites.value].sort((a, b) => {
            return a.video_title.localeCompare(b.video_title)
        })
    }
})

async function removeFavorite(videoId: string) {
    const userId = userDataStore.getUserId()
    if (!userId) return

    deletingMap.value[videoId] = true
    Toastify({
        text: 'Eliminando...',
        duration: 1500,
        className: 'toast-glass',
        gravity: 'top',
        position: 'right',
    }).showToast()

    try {
        await removeFavoriteMusic({ user_id: userId, video_id: videoId })

        // Invalidar y recargar favoritos
        await userDataStore.invalidateAndRefreshFavorites()

        Toastify({
            text: 'Eliminado de favoritos',
            duration: 1500,
            className: 'toast-glass',
            gravity: 'top',
            position: 'right',
        }).showToast()
    } catch (e) {
        Toastify({
            text: 'Error al eliminar favorito',
            duration: 1500,
            className: 'toast-glass',
            gravity: 'top',
            position: 'right',
        }).showToast()
        console.error(e)
    } finally {
        deletingMap.value[videoId] = false
    }
}

function playFavorite(index: number) {
    const playlist = sortedFavorites.value.map((fav) => ({
        video_id: fav.video_id,
        video_title: fav.video_title,
        video_thumbnail: fav.video_thumbnail,
    }))
    playerStore.setPlaylist(playlist, index)
}

function toggleSortOption() {
    sortOption.value = sortOption.value === 'recent' ? 'alphabetical' : 'recent'
}

async function refreshFavorites() {
    await userDataStore.invalidateAndRefreshFavorites()
    Toastify({
        text: 'Favoritos actualizados',
        duration: 1500,
        className: 'toast-glass',
        gravity: 'top',
        position: 'right',
    }).showToast()
}

// CARGADO YA EN LAYOUT PRINCIPAL
onMounted(() => {
    console.log('Favoritos: usando datos del store (sin petición)')
})
</script>

<template>
    <DashboardLayout>
        <div class="container-fluid px-0">
            <div class="d-flex justify-content-between align-items-center mb-4 px-3">
                <h4 class="text-white mb-0 fw-bold">Favoritos</h4>
                <div class="d-flex gap-2">
                    <button @click="toggleSortOption"
                        class="btn btn-dark btn-sm rounded-pill px-3 filter-button-favorites">
                        <i :class="sortOption === 'recent' ? 'bi bi-clock-history' : 'bi bi-sort-alpha-down'"
                            class="me-1" />
                        {{ sortOption === 'recent' ? 'Recientes' : 'A-Z' }}
                    </button>
                    <button @click="refreshFavorites" :disabled="loading"
                        class="btn btn-outline-light btn-sm rounded-pill px-3 refresh-button-favorites"
                        title="Refrescar Favoritos" style="border: 1px solid rgba(255, 255, 255, 0.08);">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-arrow-clockwise"></i>
                    </button>
                    <span v-if="!loading && favorites.length > 0" class="cached-badge" title="Datos en caché">
                        <i class="bi bi-database"></i>
                    </span>
                </div>
            </div>

            <div class="row px-3 py-2 text-secondary d-none d-md-flex mb-2 border-bottom border-white border-opacity-10"
                style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">
                <div class="col-1 text-center">#</div>
                <div class="col-6">Título</div>
                <div class="col-3 text-center">Agregado el</div>
                <div class="col-2 text-center">Acciones</div>
            </div>

            <div class="px-0">
                <div v-for="(fav, index) in sortedFavorites" :key="fav.id"
                    class="song-row row align-items-center p-2 mx-0 mb-1" @dblclick="playFavorite(index)">

                    <div class="col-1 text-secondary index-col text-center">
                        <span class="number">{{ index + 1 }}</span>
                        <i class="bi bi-play-fill play-icon text-white" @click="playFavorite(index)"
                            title="Reproducir"></i>
                    </div>

                    <div class="col-10 col-md-6 d-flex align-items-center gap-3">
                        <img :src="fav.video_thumbnail" class="rounded shadow-sm"
                            style="width: 44px; height: 44px; object-fit: cover" />
                        <div class="text-truncate">
                            <h6 class="text-white mb-0 text-truncate fw-semibold" style="font-size: 0.9rem;">{{
                                fav.video_title }}</h6>
                            <small class="text-secondary" style="font-size: 12px;">JearCast Music</small>
                        </div>
                    </div>

                    <div class="col-3 d-none d-md-block text-secondary small text-center font-monospace">
                        {{ fav.created_at?.toDate().toLocaleDateString() }}
                    </div>

                    <!-- En lugar del botón simple, usa el componente -->
                    <div class="col-1 col-md-2 d-flex justify-content-center align-items-center gap-2">
                        <button @click="removeFavorite(fav.video_id)" class="btn btn-link p-0 remove-btn"
                            title="Eliminar de favoritos">
                            <span v-if="deletingMap[fav.video_id]"
                                class="spinner-border spinner-border-sm text-secondary"></span>
                            <i v-else class="bi bi-heart-fill text-secondary"
                                style="font-size: 1.12rem !important;"></i>
                        </button>

                        <DownloadButton :video-id="fav.video_id" :title="fav.video_title"
                            :thumbnail="fav.video_thumbnail" />
                    </div>
                </div>
            </div>
        </div>
    </DashboardLayout>
</template>

<style scoped>
.filter-button-favorites {
    transition: background-color 0.3s, color 0.3s;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
}

.refresh-button-favorites {
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
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'
import type { FavoriteMusicModel } from '@/domain/models/FavoriteMusicModel'
import { getFavoritesByUser } from '@/domain/usecases/favorites/GetFavoritesByUser'
import { removeFavoriteMusic } from '@/domain/usecases/favorites/RemoveFavoriteMusic'
import Toastify from 'toastify-js'
import { usePlayerStore } from '@/stores/player-store'

const favorites = ref<FavoriteMusicModel[]>([])
const sortedFavorites = ref<FavoriteMusicModel[]>([])
const sortOption = ref<'recent' | 'alphabetical'>('recent')

const loading = ref(false)
const error = ref<string | null>(null)
const deletingMap = ref<Record<string, boolean>>({})
const hasLoaded = ref(false)

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

function sortFavorites() {
    if (sortOption.value === 'recent') {
        sortedFavorites.value = [...favorites.value].sort((a, b) => {
            return (b.created_at?.toDate()?.getTime() || 0) - (a.created_at?.toDate()?.getTime() || 0)
        })
    } else if (sortOption.value === 'alphabetical') {
        sortedFavorites.value = [...favorites.value].sort((a, b) => {
            return a.video_title.localeCompare(b.video_title)
        })
    }
}

async function reloadFavorites(force = false) {
    if (hasLoaded.value && !force) return

    const userId = getUserId()
    if (!userId) {
        error.value = 'Usuario no autenticado'
        return
    }

    loading.value = true
    error.value = null

    try {
        favorites.value = await getFavoritesByUser(userId)
        sortFavorites()
        hasLoaded.value = true
    } catch (e) {
        error.value = 'Error cargando favoritos'
        console.error(e)
    } finally {
        loading.value = false
    }
}

async function removeFavorite(videoId: string) {
    const userId = getUserId()
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
        Toastify({
            text: 'Eliminado de favoritos',
            duration: 1500,
            className: 'toast-glass',
            gravity: 'top',
            position: 'right',
        }).showToast()
        await reloadFavorites(true)
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
    const playerStore = usePlayerStore()
    playerStore.setPlaylist(playlist, index)
}

function toggleSortOption() {
    sortOption.value = sortOption.value === 'recent' ? 'alphabetical' : 'recent'
    sortFavorites()
}

onMounted(() => {
    reloadFavorites()
})
</script>

<template>
    <DashboardLayout>
        <div class="container-fluid px-0">
            <div class="d-flex justify-content-between align-items-center mb-4 px-3">
                <h4 class="text-white mb-0 fw-bold">Favoritos</h4>
                <div class="d-flex gap-2">
                    <button @click="toggleSortOption" class="btn btn-dark btn-sm border-secondary rounded-pill px-3">
                        <i :class="sortOption === 'recent' ? 'bi bi-clock-history' : 'bi bi-sort-alpha-down'"
                            class="me-1" />
                        {{ sortOption === 'recent' ? 'Recientes' : 'A-Z' }}
                    </button>
                    <button @click="() => reloadFavorites(true)" :disabled="loading"
                        class="btn btn-outline-light btn-sm rounded-pill px-3">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-arrow-clockwise"></i>
                    </button>
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
                        <i class="bi bi-play-fill play-icon text-white" @click="playFavorite(index)"></i>
                    </div>

                    <div class="col-10 col-md-6 d-flex align-items-center gap-3">
                        <img :src="fav.video_thumbnail" class="rounded shadow-sm"
                            style="width: 48px; height: 48px; object-fit: cover" />
                        <div class="text-truncate">
                            <h6 class="text-white mb-0 text-truncate fw-semibold" style="font-size: 0.9rem;">{{
                                fav.video_title }}</h6>
                            <small class="text-secondary">YouTube Music</small>
                        </div>
                    </div>

                    <div class="col-3 d-none d-md-block text-secondary small text-center font-monospace">
                        {{ fav.created_at?.toDate().toLocaleDateString() }}
                    </div>

                    <div class="col-1 col-md-2 d-flex justify-content-center align-items-center">
                        <button @click="removeFavorite(fav.video_id)" class="btn btn-link p-0 remove-btn">
                            <span v-if="deletingMap[fav.video_id]"
                                class="spinner-border spinner-border-sm text-secondary"></span>
                            <i v-else class="bi bi-heart-fill text-danger"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </DashboardLayout>
</template>
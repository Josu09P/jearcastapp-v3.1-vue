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
            return (
                (b.created_at?.toDate()?.getTime() || 0) -
                (a.created_at?.toDate()?.getTime() || 0)
            )
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
    Toastify({ text: 'Eliminando...', duration: 1500, className: "toast-glass", gravity: "top", position: "right" }).showToast()

    try {
        await removeFavoriteMusic({ user_id: userId, video_id: videoId })
        Toastify({ text: 'Eliminado de favoritos', duration: 1500, className: "toast-glass", gravity: "top", position: "right" }).showToast()
        await reloadFavorites(true)
    } catch (e) {
        Toastify({ text: 'Error al eliminar favorito', duration: 1500, className: "toast-glass", gravity: "top", position: "right" }).showToast()
        console.error(e)
    } finally {
        deletingMap.value[videoId] = false
    }
}

function playFavorite(index: number) {
    const playlist = sortedFavorites.value.map(fav => ({
        video_id: fav.video_id,
        video_title: fav.video_title,
        video_thumbnail: fav.video_thumbnail
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
        <div class="container">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="text-white mb-0 title-page">Favoritos</h4>
                <div class="d-flex align-items-center gap-2">
                    <button @click="toggleSortOption" class="btn btn-light btn-sm">
                        <i :class="sortOption === 'recent' ? 'bi bi-clock-history' : 'bi bi-sort-alpha-down'" />
                        {{ sortOption === 'recent' ? 'Recientes' : 'A-Z' }}
                    </button>
                    <button @click="() => reloadFavorites(true)" :disabled="loading"
                        class="btn btn-outline-light btn-sm">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-arrow-clockwise me-1"></i>
                        Recargar
                    </button>
                </div>
            </div>

            <div v-if="favorites.length === 0 && !loading" class="text-white p-4">No tienes favoritos aún.</div>
            <div v-if="error" class="text-danger">{{ error }}</div>

            <div v-if="sortedFavorites.length > 0" class="container-scroll-wrapper-all mt-3 p-3 rounded">
                <div class="row">
                    <div v-for="(fav, index) in sortedFavorites" :key="fav.id"
                        class="col-12 col-md-6 col-lg-6 col-xl-3 mb-3">
                        <div class="card h-100 flex-row shadow-sm p-2 align-items-center video-card-custom">
                            <img :src="fav.video_thumbnail" :alt="fav.video_title" class="rounded-start me-3"
                                style="width: 120px; height: 80px; object-fit: cover" />
                            <div class="flex-grow-1 d-flex flex-column justify-content-between" style="min-width: 0;">
                                <h6 class="card-title text-truncate mb-1" :title="fav.video_title"
                                    style="font-size: 0.85rem;">
                                    {{ fav.video_title }}
                                </h6>
                                <small class="ms-1 text-center text-light date-container">
                                    {{ fav.created_at?.toDate().toLocaleDateString() }}
                                </small>

                                <div class="d-flex justify-content-start gap-2" style="margin: 10px 0 0 20px">
                                    <button @click="playFavorite(index)" class="btn btn-sm">
                                        <i class="bi bi-play-circle"></i>
                                    </button>
                                    <button @click="removeFavorite(fav.video_id)" class="btn btn-sm text-light"
                                        :disabled="deletingMap[fav.video_id]">
                                        <span v-if="deletingMap[fav.video_id]"
                                            class="spinner-border spinner-border-sm"></span>
                                        <i v-else class="bi bi-trash-fill"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </DashboardLayout>
</template>

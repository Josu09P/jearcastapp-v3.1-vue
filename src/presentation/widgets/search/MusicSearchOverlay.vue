<template>
    <div v-if="visible" class="search-overlay" @click.self="close">
        <div class="search-box">
            <form @submit.prevent="onSearch" class="search-form">
                <div class="d-flex flex-wrap justify-content-center align-items-center gap-3">
                    <input v-model="query" type="text" class="form-control search-input" placeholder="Buscar música..."
                        autofocus />
                    <div class="d-flex gap-2">
                        <button type="submit"
                            class="btn btn-outline-light btn-search d-flex align-items-center justify-content-center button-search-custom"
                            :disabled="searching">
                            <span v-if="searching" class="spinner-border spinner-border-sm"></span>
                            <i v-else class="bi bi-search"></i>
                        </button>
                        <button type="button"
                            class="btn btn-outline-light btn-search d-flex align-items-center justify-content-center button-search-custom"
                            @click="close">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>
            </form>

            <!-- Estado de API Keys (ahora sí funciona) -->
            <div v-if="apiKeys.length > 0" class="mt-3 text-center">
                <span class="badge me-2" :class="currentApiKeyIndex !== -1 ? 'bg-success' : 'bg-danger'">
                    <i class="bi bi-key me-1"></i>
                    {{ currentApiKeyIndex !== -1 ? `Usando Key ${currentApiKeyIndex + 1} de ${apiKeys.length}` :
                        'Sinkeys activas' }}
                </span>
                <span v-if="quotaExceeded" class="badge bg-warning text-dark ms-2">
                    <i class="bi bi-exclamation-triangle me-1"></i>
                    Cuota excedida, cambiando de key...
                </span>
            </div>
            <div v-else class="mt-3 text-center">
                <span class="badge bg-danger">
                    <i class="bi bi-exclamation-circle me-1"></i>
                    No hay API Keys configuradas. Ve a Configuración.
                </span>
            </div>

            <div v-if="searchPerformed">
                <h6 class="text-white mt-4"><span class="result-search-text">Resultados para: "{{ query }}"</span></h6>
                <div class="row gx-3 gy-4 mt-3">
                    <div v-for="(video, index) in results" :key="video.videoId" class="col-md-6 col-lg-4 col-xl-3">
                        <div class="card h-100 flex-row shadow-sm p-2 align-items-center video-card-custom">
                            <img :src="video.thumbnail" :alt="video.title" class="rounded-start me-3"
                                style="width: 120px; height: 80px; object-fit: cover" />
                            <div class="flex-grow-1 d-flex flex-column justify-content-between" style="min-width: 0;">
                                <div>
                                    <h6 class="card-title text-truncate mb-1" :title="video.title"
                                        style="font-size: 0.85rem">
                                        {{ video.title }}
                                    </h6>
                                    <p class="text-light small mb-2">
                                        <i class="bi bi-eye"></i>
                                        {{ video.viewCount.toLocaleString() }} vistas
                                    </p>
                                </div>
                                <div class="d-flex justify-content-start gap-2">
                                    <button @click="playVideo(index)" class="btn btn-sm">
                                        <i class="bi bi-play-circle"></i>
                                    </button>
                                    <button @click="addToFavorites(video)" class="btn btn-sm">
                                        <i class="bi bi-heart"></i>
                                    </button>
                                    <button @click="openPlaylistModal(video)" class="btn btn-sm">
                                        <i class="bi bi-plus-lg"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="showPlaylistModal" class="modal-backdrop" @click.self="showPlaylistModal = false">
            <div class="search-modal-content">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="text-white mb-0">Agregar / Crear Playlist</h5>
                    <button class="btn btn-outline-light d-flex align-items-center justify-content-center"
                        @click="refreshPlaylists" :disabled="loadingPlaylists"
                        style="border-radius: 1rem; height: 36px; padding: 0 10px;">
                        <i :class="['bi', 'me-0', loadingPlaylists ? 'bi-arrow-repeat spin-animation' : 'bi-arrow-clockwise']"
                            style="font-size: 16px; vertical-align: middle; line-height: 1;"></i>
                    </button>
                </div>

                <div v-if="playlists.length > 0" class="mb-3">
                    <select v-model="selectedPlaylistId" class="form-select mb-2">
                        <option disabled value="">Selecciona una playlist</option>
                        <option v-for="p in playlists" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                    <button class="btn btn-outline-light btn-search w-100 mb-3" @click="addToPlaylist">Agregar a la
                        playlist</button>
                </div>

                <div>
                    <input v-model="newPlaylistName" type="text" class="form-control mb-2"
                        placeholder="Nueva playlist..." />
                    <button class="btn btn-outline-light btn-search w-100" @click="createNewPlaylist">Crear y
                        agregar</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { getVideoStats } from '@/data/services/youtube/GetVideoStats'
import { searchYoutube } from '@/data/services/youtube/SearchYoutube'
import { addFavoriteMusic } from '@/domain/usecases/favorites/AddFavoriteMusic'
import { usePlayerStore } from '@/stores/player-store'
import { useUserStore } from '@/stores/user'
import Toastify from 'toastify-js'
import { getPlaylistsByUser } from '@/domain/usecases/playlists/GetPlaylistsByUser'
import type { PlaylistModel } from '@/domain/models/PlayListModel'
import { songExistsInPlaylist } from '@/domain/usecases/playlists/SongExistsInPlaylist'
import { addSongToPlaylistService } from '@/data/services/firestore/PlaylistsFirestore'
import { createOrGetPlaylist } from '@/domain/usecases/playlists/CreateOrGetPlaylist'
import { getApiKeys } from '@/domain/usecases/users/GetApiKeysUseCase'
import { toggleApiKeyStatus } from '@/domain/usecases/users/UpdateApiKeyUseCase'
import type { ApiKeyModel } from '@/domain/models/UserModel'

const query = ref('')
const results = ref<any[]>([])
const searchPerformed = ref(false)
const props = defineProps<{ visible: boolean }>()
const addingFavoritesMap = ref<Record<string, boolean>>({})
const isProcessing = ref(false)
const searching = ref(false)
const emit = defineEmits<{
    (e: 'close'): void
    (e: 'openPlaylistModal', video: any): void
}>()
const close = () => emit('close')
const loadingPlaylists = ref(false)
const userStore = useUserStore()
const playerStore = usePlayerStore()
const playlists = ref<PlaylistModel[]>([])
const selectedPlaylistId = ref('')
const newPlaylistName = ref('')
const showPlaylistModal = ref(false)
const selectedVideo = ref<any | null>(null)

// ==================== GESTIÓN DE API KEYS ====================
const apiKeys = ref<ApiKeyModel[]>([])
const currentApiKeyIndex = ref(-1)
const quotaExceeded = ref(false)
const usingFirestoreKeys = ref(false) // Indica si estamos usando keys de Firestore

// Obtener solo keys activas
const activeApiKeys = computed(() => {
    return apiKeys.value.filter(key => key.isActive)
})

// Guardar API key en localStorage (como la principal)
const saveApiKeyToLocalStorage = (key: string) => {
    // Actualizar el userStore y localStorage
    if (userStore.id) {
        const userData = {
            id: userStore.id,
            name: userStore.name,
            email: userStore.email,
            apikeyYoutube: key,
            create_at: userStore.create_at
        }
        userStore.setUser(userData)
        console.log('API Key guardada en localStorage como principal')
    }
}

// Probar si una API key funciona
const testApiKey = async (key: string): Promise<boolean> => {
    try {
        console.log('🔍 Probando API Key...')
        await searchYoutube('test', key)
        return true
    } catch (error: any) {
        console.log('API Key falló:', error.message)
        return false
    }
}

// Cargar API Keys desde Firestore
const loadApiKeysFromFirestore = async () => {
    if (!userStore.id) return false
    try {
        const keys = await getApiKeys(userStore.id)
        apiKeys.value = keys
        console.log('API Keys cargadas desde Firestore:', keys.length)
        return keys.length > 0
    } catch (error) {
        console.error('Error cargando API Keys desde Firestore:', error)
        return false
    }
}

// Inicializar la búsqueda con la mejor API key disponible
const initializeSearch = async (): Promise<boolean> => {
    // 1. PRIMERO: Intentar con la API key del userStore (localStorage)
    if (userStore.apikeyYoutube) {
        const works = await testApiKey(userStore.apikeyYoutube)
        if (works) {
            console.log('Usando API Key principal de localStorage')
            usingFirestoreKeys.value = false
            currentApiKeyIndex.value = 0
            // Crear una key temporal para mantener compatibilidad
            apiKeys.value = [{
                key: userStore.apikeyYoutube,
                service: 'youtube',
                isActive: true,
                created_at: new Date()
            }]
            return true
        } else {
            console.log('API Key principal falló, buscará en Firestore...')
        }
    }

    // 2. SEGUNDO: Si la principal falló, cargar desde Firestore
    const hasFirestoreKeys = await loadApiKeysFromFirestore()

    if (hasFirestoreKeys && activeApiKeys.value.length > 0) {
        usingFirestoreKeys.value = true
        currentApiKeyIndex.value = 0

        // PROBAR la primera key de Firestore
        const firstKey = activeApiKeys.value[0]
        const works = await testApiKey(firstKey.key)

        if (works) {
            // Si funciona, guardarla como principal en localStorage
            saveApiKeyToLocalStorage(firstKey.key)
            console.log('Key de Firestore funciona, guardada en localStorage')
            return true
        } else {
            // Si no funciona, desactivarla y probar la siguiente
            await toggleApiKeyStatus(userStore.id!, firstKey)
            // Recargar keys y continuar con el failover normal
            await loadApiKeysFromFirestore()
        }
    }

    return activeApiKeys.value.length > 0
}

// Cambiar a la siguiente API key activa
const switchToNextApiKey = async () => {
    quotaExceeded.value = true

    if (usingFirestoreKeys.value) {
        // Estamos usando keys de Firestore
        const currentKey = activeApiKeys.value[currentApiKeyIndex.value]

        if (currentKey) {
            try {
                // Desactivar la key actual
                await toggleApiKeyStatus(userStore.id!, currentKey)
                showToast(`Key ${currentApiKeyIndex.value + 1} desactivada por límite de cuota`)
            } catch (error) {
                console.error('Error desactivando key:', error)
            }
        }

        // Recargar keys desde Firestore
        await loadApiKeysFromFirestore()

        // Buscar siguiente key activa
        if (activeApiKeys.value.length > 0) {
            currentApiKeyIndex.value = 0
            const newKey = activeApiKeys.value[0]
            // Guardar la nueva key en localStorage
            saveApiKeyToLocalStorage(newKey.key)
            showToast(`Cambiando a nueva API Key...`)
        } else {
            currentApiKeyIndex.value = -1
            usingFirestoreKeys.value = false
            showToast('No hay más API Keys activas. Espera 24 horas o agrega una nueva.')
        }
    } else {
        // Estamos usando la key principal de localStorage y falló
        // Cambiar a modo Firestore
        console.log('Key principal falló, cambiando a Firestore...')
        const hasKeys = await loadApiKeysFromFirestore()

        if (hasKeys && activeApiKeys.value.length > 0) {
            usingFirestoreKeys.value = true
            currentApiKeyIndex.value = 0
            const newKey = activeApiKeys.value[0]
            saveApiKeyToLocalStorage(newKey.key)
            showToast(`Cambiando a API Key de respaldo...`)
        } else {
            currentApiKeyIndex.value = -1
            showToast('No hay API Keys disponibles.')
        }
    }

    setTimeout(() => {
        quotaExceeded.value = false
    }, 3000)
}

// Función para ejecutar búsqueda
const executeSearch = async (searchQuery: string): Promise<any[]> => {
    // Si no hay key actual, intentar inicializar
    if (currentApiKeyIndex.value === -1) {
        const initialized = await initializeSearch()
        if (!initialized) {
            throw new Error('No hay API Keys disponibles')
        }
    }

    const currentKey = usingFirestoreKeys.value
        ? activeApiKeys.value[currentApiKeyIndex.value]
        : { key: userStore.apikeyYoutube } // Key principal

    if (!currentKey?.key) {
        throw new Error('No hay API Key disponible')
    }

    try {
        console.log(`Buscando con API Key...`)

        // Intentar búsqueda
        const videos = await searchYoutube(searchQuery, currentKey.key)

        // Obtener estadísticas
        const stats = await getVideoStats(videos.map((v: any) => v.videoId).join(','), currentKey.key)

        return videos.map((v: any) => {
            const stat = stats.find((s: any) => s.videoId === v.videoId)
            return {
                ...v,
                viewCount: stat?.viewCount || 0
            }
        })

    } catch (error: any) {
        console.error('Error en búsqueda:', error)

        // Detectar si es error de cuota (403)
        if (error.message?.includes('quota') || error.message?.includes('403') || error.message?.includes('exceeded')) {
            // Cambiar a siguiente key
            await switchToNextApiKey()
            // Reintentar la búsqueda con la nueva key
            return executeSearch(searchQuery)
        }

        throw error
    }
}

// Modificar onSearch para usar la nueva lógica
const onSearch = async () => {
    if (!query.value) return

    searching.value = true
    searchPerformed.value = true
    results.value = []

    try {
        results.value = await executeSearch(query.value)
        if (results.value.length === 0) {
            showToast('No se encontraron resultados')
        }
    } catch (error: any) {
        console.error('Error en búsqueda:', error)
        showToast(error.message || 'Error al buscar')
    } finally {
        searching.value = false
    }
}

// ==================== FIN GESTIÓN API KEYS ====================

const showToast = (text: string) => {
    Toastify({
        text,
        duration: 2000,
        gravity: 'top',
        position: 'right',
        className: 'toast-glass'
    }).showToast()
}

const refreshPlaylists = async () => {
    if (!userStore.id) return
    loadingPlaylists.value = true

    playlists.value = await getPlaylistsByUser(userStore.id)
    showToast('Playlists actualizadas')

    setTimeout(() => {
        loadingPlaylists.value = false
    }, 1000)
}

// Al montar el componente, NO cargar Firestore, solo preparar
onMounted(async () => {
    if (!userStore.id) return

    // Solo registrar que estamos listos, pero no cargar Firestore aún
    console.log('Buscador listo, usando API Key principal de localStorage')

    // Si hay API key principal, prepararla
    if (userStore.apikeyYoutube) {
        apiKeys.value = [{
            key: userStore.apikeyYoutube,
            service: 'youtube',
            isActive: true,
            created_at: new Date()
        }]
        currentApiKeyIndex.value = 0
        usingFirestoreKeys.value = false
    }

    playlists.value = await getPlaylistsByUser(userStore.id)
})

// Cuando se abre el buscador, verificar la key principal
watch(() => props.visible, async (newVal) => {
    if (newVal && userStore.id) {
        // Si no hay key actual, intentar con la principal
        if (currentApiKeyIndex.value === -1 && userStore.apikeyYoutube) {
            apiKeys.value = [{
                key: userStore.apikeyYoutube,
                service: 'youtube',
                isActive: true,
                created_at: new Date()
            }]
            currentApiKeyIndex.value = 0
            usingFirestoreKeys.value = false
        }
    }
})

const playVideo = (index: number) => {
    const playlist = results.value.map((video: any) => ({
        video_id: video.videoId,
        video_title: video.title,
        video_thumbnail: video.thumbnail
    }))

    const currentVideo = playlist[index]
    saveToRecentlyPlayed(currentVideo)
    playerStore.setPlaylist(playlist, index)
}

const saveToRecentlyPlayed = (video: any) => {
    const key = 'recentlyPlayed'
    const maxItems = 20
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const filtered = existing.filter((v: any) => v.video_id !== video.video_id)
    filtered.unshift(video)
    const limited = filtered.slice(0, maxItems)
    localStorage.setItem(key, JSON.stringify(limited))
}

const addToFavorites = async (video: any) => {
    if (!userStore.id || addingFavoritesMap.value[video.videoId]) return

    addingFavoritesMap.value[video.videoId] = true
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

const addToPlaylist = async () => {
    if (isProcessing.value) return
    if (!userStore.id || !selectedVideo.value || !selectedPlaylistId.value) {
        return showToast('Faltan datos para agregar a la playlist')
    }

    isProcessing.value = true
    showToast('Añadiendo a la playlist...')

    try {
        const exists = await songExistsInPlaylist(selectedPlaylistId.value, selectedVideo.value.videoId)
        if (exists) {
            return showToast('La canción ya está en esta playlist')
        }

        await addSongToPlaylistService(selectedPlaylistId.value, {
            video_id: selectedVideo.value.videoId,
            video_title: selectedVideo.value.title,
            video_thumbnail: selectedVideo.value.thumbnail
        })

        showToast('Agregado a la playlist')
        showPlaylistModal.value = false
    } catch (error) {
        showToast('Error al agregar a la playlist')
    } finally {
        isProcessing.value = false
    }
}

const createNewPlaylist = async () => {
    if (isProcessing.value) return
    if (!newPlaylistName.value || !userStore.id) return showToast('Nombre no válido')

    isProcessing.value = true
    showToast('Creando playlist...')

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

        showToast('Canción añadida a la nueva playlist')
        showPlaylistModal.value = false
    } catch (error) {
        showToast('Error al crear la playlist')
    } finally {
        isProcessing.value = false
    }
}
</script>

<style scoped>
@import url('@/assets/css/search-styles.css');
</style>
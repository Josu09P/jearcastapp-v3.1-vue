<template>
    <div class="artist-picker-widget p-3 p-md-4">
        <!-- Header del Buscador -->
        <div class="widget-header mb-3">
            <h5 class="section-title text-white mb-2">
                <i class="bi bi-search me-2" style="color: var(--accent-color) !important;"></i>
                Descubrir Artistas
            </h5>
            <p class="section-subtitle mb-3 text-secondary">
                Busca tus artistas y canales favoritos
            </p>

            <!-- Buscador -->
            <div class="search-box mb-4">
                <i class="bi bi-search search-icon"></i>
                <input v-model="searchQuery" type="text" class="form-control search-input"
                    placeholder="Escribe el nombre de un artista..." @keyup.enter="searchOnYouTube" />
                <button v-if="searchQuery" @click="searchOnYouTube" class="search-btn" title="Buscar en YouTube">
                    <i class="bi bi-youtube"></i>
                </button>
            </div>

            <!-- Loading -->
            <div v-if="searchingOnYoutube" class="text-center py-4 glass-card mb-4">
                <div class="spinner-border spinner-border-sm text-accent" role="status">
                    <span class="visually-hidden">Buscando...</span>
                </div>
                <p class="text-secondary small mt-2">Buscando en YouTube...</p>
            </div>

            <!-- Sugerencias de artistas -->
            <div v-if="!youtubeResults.length && !searchingOnYoutube" class="artist-suggestions mb-4">
                <p class="section-subtitle mb-3 text-secondary">Sugerencias recomendadas:</p>
                <div class="suggestion-pills">
                    <div v-for="artist in filteredArtists" :key="artist.name" class="suggestion-pill"
                        @click="selectSuggestedArtist(artist.name)">
                        <span>{{ artist.name }}</span>
                        <i class="bi bi-search ms-2 small"></i>
                    </div>
                </div>
            </div>

            <!-- Resultados de búsqueda en YouTube -->
            <div v-if="youtubeResults.length" class="search-results-section">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="text-white mb-0">Resultados encontrados:</h6>
                    <button @click="youtubeResults = []"
                        class="btn btn-sm btn-link text-secondary text-decoration-none">
                        Limpiar resultados
                    </button>
                </div>
                <div class="artist-grid">
                    <div v-for="artist in youtubeResults" :key="artist.channelId" class="artist-card" :class="{
                        selected: isArtistFavorite(artist.channelId),
                        processing: isProcessing[artist.channelId]
                    }" @click="toggleArtist(artist)">
                        <div class="artist-card-img">
                            <img :src="getArtistImage(artist.name, artist.channelId, artist.thumbnail)"
                                :alt="artist.name" @error="onImageError($event, artist.name)" />

                            <!-- Spinner de carga -->
                            <div v-if="isProcessing[artist.channelId]" class="artist-card-spinner">
                                <div class="spinner-border spinner-border-sm text-white" role="status"></div>
                            </div>

                            <div v-else-if="isArtistFavorite(artist.channelId)" class="artist-card-check">
                                <i class="bi bi-check-circle-fill"></i>
                            </div>
                            <div v-else class="artist-card-add-icon">
                                <i class="bi bi-plus-circle"></i>
                            </div>
                        </div>
                        <div class="artist-card-name">{{ artist.name }}</div>
                        <span v-if="artist.subscriberCount" class="artist-card-genre">
                            {{ artist.subscriberCount }} subs
                        </span>
                    </div>
                </div>
            </div>

            <!-- Sin resultados -->
            <div v-if="!searchingOnYoutube && !filteredArtists.length && !youtubeResults.length && searchQuery"
                class="text-center py-5 glass-card">
                <i class="bi bi-emoji-frown mb-2 d-block text-secondary" style="font-size: 2rem;"></i>
                <p class="text-secondary small">No encontramos resultados para "{{ searchQuery }}".<br>
                    Intenta con otro nombre o presiona <i class="bi bi-youtube text-danger"></i>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useArtistStore } from '@/stores/artist-store'
import { artistDiscoveryService } from '@/data/services/youtube/ArtistDiscoveryService'
import Toastify from 'toastify-js'

const artistStore = useArtistStore()
const searchQuery = ref('')
const youtubeResults = ref<any[]>([])
const searchingOnYoutube = ref(false)
const imageCache = reactive<Record<string, string>>({})

const DEFAULT_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#1a1a2e"/><text x="60" y="65" text-anchor="middle" fill="#1db954" font-size="40" font-family="Arial">♪</text></svg>'
)

const popularArtists = artistDiscoveryService.getPopularArtists()

const loadArtistImage = async (name: string, channelId: string, thumbnail?: string) => {
    if (imageCache[channelId]) return
    if (thumbnail && thumbnail.startsWith('http')) {
        imageCache[channelId] = thumbnail
        return
    }

    try {
        if ((window as any).electron?.ipcRenderer?.invoke) {
            const info = await (window as any).electron.ipcRenderer.invoke('youtube-channel-info', channelId)
            if (info?.thumbnail) {
                imageCache[channelId] = info.thumbnail
                return
            }
        }
    } catch { /* ignore */ }

    imageCache[channelId] = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a2e&color=1db954&size=120&bold=true`
}

const getArtistImage = (name: string, channelId: string, thumbnail?: string): string => {
    return imageCache[channelId] || thumbnail || DEFAULT_IMAGE
}

const onImageError = (event: Event, name: string) => {
    const img = event.target as HTMLImageElement
    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'YT')}&background=1a1a2e&color=1db954&size=120&bold=true`
}

const selectSuggestedArtist = (name: string) => {
    searchQuery.value = name
    searchOnYouTube()
}

const filteredArtists = computed(() => {
    const artists = popularArtists
    if (!searchQuery.value) return artists.slice(0, 15)
    const query = searchQuery.value.toLowerCase()
    return artists.filter((a: any) => a.name.toLowerCase().includes(query)).slice(0, 15)
})

const searchOnYouTube = async () => {
    if (!searchQuery.value || searchingOnYoutube.value) return
    searchingOnYoutube.value = true
    youtubeResults.value = []

    try {
        if ((window as any).electron?.ipcRenderer?.invoke) {
            const channels = await (window as any).electron.ipcRenderer.invoke('youtube-search-channels', searchQuery.value)

            youtubeResults.value = channels.map((ch: any) => {
                const chId = ch.channelId || ch.channel_id
                if (chId) loadArtistImage(ch.name || searchQuery.value, chId, ch.thumbnail)
                return {
                    channelId: chId,
                    name: ch.name || searchQuery.value,
                    thumbnail: ch.thumbnail || '',
                    subscriberCount: ch.subscriberCount || ''
                }
            })
        }
    } catch (error) {
        console.error('Error buscando en YouTube:', error)
    } finally {
        searchingOnYoutube.value = false
    }
}

const isArtistFavorite = (channelId: string) => artistStore.isArtistFavorite(channelId)

const isProcessing = ref<Record<string, boolean>>({})

const toggleArtist = async (artist: any) => {
    if (isProcessing.value[artist.channelId]) return
    isProcessing.value[artist.channelId] = true

    try {
        if (isArtistFavorite(artist.channelId)) {
            await artistStore.removeArtist(artist.channelId)
            Toastify({ text: 'Artista eliminado', duration: 2000, className: 'toast-glass' }).showToast()
        } else {
            const result = await artistStore.addArtist({
                artist_name: artist.name,
                channel_id: artist.channelId,
                thumbnail: imageCache[artist.channelId] || artist.thumbnail,
                genres: []
            })
            if (result === 'added') {
                Toastify({ text: `${artist.name} agregado`, duration: 2000, className: 'toast-glass' }).showToast()
            } else if (result === 'exists') {
                Toastify({ text: 'Ya está en tus favoritos', duration: 2000, className: 'toast-glass bg-warning' }).showToast()
            }
        }
    } finally {
        isProcessing.value[artist.channelId] = false
    }
}
</script>

<style scoped>
.search-box {
    position: relative;
}

.search-icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.3);
    z-index: 2;
}

.search-input {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 12px;
    padding: 12px 50px 12px 45px;
    font-size: 0.95rem;
    transition: all 0.3s;
}

.search-input:focus {
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.1);
}

.search-input::placeholder {
    color: rgba(255, 255, 255, 0.3);
}

.search-btn {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 0, 0, 0.2);
    border: 1px solid rgba(255, 0, 0, 0.3);
    color: #ff4444;
    border-radius: 8px;
    padding: 5px 12px;
    cursor: pointer;
    z-index: 2;
}

.suggestion-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.suggestion-pill {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
    padding: 0.6rem 1.2rem;
    border-radius: 20px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.suggestion-pill:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--accent-color);
    color: white;
    transform: translateY(-2px);
}

.artist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 1rem;
    padding: 0.5rem;
}

.artist-card {
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    padding: 0.75rem;
    border-radius: 16px;
    border: 1px solid transparent;
}

.artist-card:hover {
    background: rgba(255, 255, 255, 0.05);
}

.artist-card.selected {
    background: rgba(29, 185, 84, 0.1);
    border-color: var(--accent-color);
}

.artist-card.processing {
    opacity: 0.7;
    pointer-events: none;
    cursor: wait;
}

.artist-card-img {
    position: relative;
    width: 80px;
    height: 80px;
    margin: 0 auto 0.75rem;
    border-radius: 50%;
    overflow: hidden;
}

.artist-card-spinner {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.artist-card-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.artist-card-check {
    position: absolute;
    bottom: 0;
    right: 0;
    background: var(--accent-color);
    color: white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
}

.artist-card-add-icon {
    position: absolute;
    bottom: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
}

.artist-card:hover .artist-card-add-icon {
    opacity: 1;
}

.artist-card-name {
    color: white;
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.artist-card-genre {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
}

.glass-card {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 1.5rem;
}

.text-accent {
    color: var(--accent-color) !important;
}
</style>

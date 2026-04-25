<template>
    <div class="artist-picker-widget">
        <!-- Header -->
        <div class="widget-header mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h5 class="section-title text-white mb-0">
                        <i class="bi bi-people-fill me-2" style="color: var(--accent-color) !important;"></i>
                        {{ favoriteArtists.length > 0 ? 'Tus Artistas' : 'Descubre Artistas' }}
                    </h5>
                    <p class="section-subtitle">
                        {{ favoriteArtists.length > 0
                            ? `${favoriteArtists.length} artistas favoritos`
                            : 'Selecciona tus artistas para recomendaciones' }}
                    </p>
                </div>
                <button v-if="favoriteArtists.length > 0" @click="generateMixes" class="btn btn-accent btn-sm"
                    :disabled="generating">
                    <i :class="['bi me-1', generating ? 'bi-hourglass-split spin-animation' : 'bi-magic']"></i>
                    {{ generating ? 'Generando' : 'Generar Mix' }}
                </button>
            </div>
        </div>

        <!-- Artistas favoritos guardados (pills) -->
        <div v-if="favoriteArtists.length > 0" class="favorite-pills-section mb-3">
            <div class="favorite-pills-scroll">
                <div v-for="artist in favoriteArtists" :key="artist.channel_id" class="favorite-pill">
                    <img :src="getArtistImage(artist.artist_name, artist.channel_id, artist.thumbnail)"
                        :alt="artist.artist_name" class="pill-img" @error="onImageError($event, artist.artist_name)" />
                    <span class="pill-name">{{ artist.artist_name }}</span>
                    <button @click="removeArtist(artist.channel_id)" class="pill-remove" title="Eliminar">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Buscador -->
        <div class="search-box mb-3">
            <i class="bi bi-search search-icon"></i>
            <input v-model="searchQuery" type="text" class="form-control search-input" placeholder="Buscar artistas..."
                @keyup.enter="searchOnYouTube" />
            <button v-if="searchQuery" @click="searchOnYouTube" class="search-btn" title="Buscar en YouTube">
                <i class="bi bi-youtube"></i>
            </button>
        </div>

        <!-- Loading -->
        <div v-if="searchingOnYoutube" class="text-center py-3">
            <div class="spinner-border spinner-border-sm text-light" role="status">
                <span class="visually-hidden">Buscando...</span>
            </div>
            <p class="text-secondary small mt-2">Buscando en YouTube...</p>
        </div>

        <!-- Sugerencias de artistas (Nombres flotantes) -->
        <div v-if="!youtubeResults.length" class="artist-suggestions mb-4">
            <p class="section-subtitle mb-2">Sugerencias para ti:</p>
            <div class="suggestion-pills">
                <div v-for="artist in filteredArtists" :key="artist.name" class="suggestion-pill" @click="selectSuggestedArtist(artist.name)">
                    <span>{{ artist.name }}</span>
                    <i class="bi bi-search ms-2 small"></i>
                </div>
            </div>
        </div>

        <!-- Resultados de búsqueda en YouTube -->
        <div v-if="youtubeResults.length" class="search-results-section">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="text-white mb-0">Resultados encontrados:</h6>
                <button @click="youtubeResults = []" class="btn btn-sm btn-link text-secondary text-decoration-none">
                    Limpiar resultados
                </button>
            </div>
            <div class="artist-grid">
                <div v-for="artist in youtubeResults" :key="artist.channelId" class="artist-card"
                    :class="{ selected: isArtistFavorite(artist.channelId) }" @click="toggleArtist(artist)">
                    <div class="artist-card-img">
                        <img :src="getArtistImage(artist.name, artist.channelId, artist.thumbnail)" :alt="artist.name"
                            @error="onImageError($event, artist.name)" />
                        <div v-if="isArtistFavorite(artist.channelId)" class="artist-card-check">
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
            class="text-center py-3">
            <p class="text-secondary small">No se encontraron artistas. Presiona
                <i class="bi bi-youtube text-danger"></i> para buscar en YouTube
            </p>
        </div>

        <!-- Mixes cacheados -->
        <div v-if="cachedMixes.length > 0 && generatedMixes.length === 0" class="generated-mixes mt-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="text-white mb-0">
                    <i class="bi bi-clock-history me-2"></i>Mixes Guardados
                </h6>
                <button @click="clearCachedMixes" class="btn btn-sm btn-outline-light btn-close-mixes">
                    <i class="bi bi-trash3"></i>
                </button>
            </div>
            <div class="mix-list">
                <div v-for="mix in cachedMixes" :key="mix.name" class="mix-item" @click="playMix(mix)">
                    <img :src="mix.cover" :alt="mix.name" class="mix-cover"
                        @error="(e: any) => e.target.src = 'https://ui-avatars.com/api/?name=Mix&background=1a1a2e&color=fff&size=80'" />
                    <div class="mix-info">
                        <h6 class="mix-name">{{ mix.name }}</h6>
                        <p class="mix-desc">{{ mix.description }}</p>
                        <span class="mix-count">{{ mix.songs.length }} canciones</span>
                    </div>
                    <div class="mix-play-icon">
                        <i class="bi bi-play-circle-fill"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mixes recién generados -->
        <div v-if="generatedMixes.length > 0" class="generated-mixes mt-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="text-white mb-0">
                    <i class="bi bi-stars text-warning me-2"></i>Mixes Generados
                </h6>
                <button @click="generatedMixes = []" class="btn btn-sm btn-outline-light btn-close-mixes">
                    <i class="bi bi-x"></i>
                </button>
            </div>
            <div class="mix-list">
                <div v-for="mix in generatedMixes" :key="mix.name" class="mix-item" @click="playMix(mix)">
                    <img :src="mix.cover" :alt="mix.name" class="mix-cover"
                        @error="(e: any) => e.target.src = 'https://ui-avatars.com/api/?name=Mix&background=1a1a2e&color=fff&size=80'" />
                    <div class="mix-info">
                        <h6 class="mix-name">{{ mix.name }}</h6>
                        <p class="mix-desc">{{ mix.description }}</p>
                        <span class="mix-count">{{ mix.songs.length }} canciones</span>
                    </div>
                    <div class="mix-play-icon">
                        <i class="bi bi-play-circle-fill"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useArtistStore } from '@/stores/artist-store'
import { artistDiscoveryService } from '@/data/services/youtube/ArtistDiscoveryService'
import { youtubeScraperService } from '@/data/services/youtube/YouTubeScraperService'
import { usePlayerStore } from '@/stores/player-store'
import Toastify from 'toastify-js'

const artistStore = useArtistStore()
const playerStore = usePlayerStore()

const searchQuery = ref('')
const generating = ref(false)
const generatedMixes = ref<any[]>([])
const youtubeResults = ref<any[]>([])
const searchingOnYoutube = ref(false)
const cachedMixes = ref<any[]>([])

// 🔥 CACHÉ DE IMÁGENES (reactivo)
const imageCache = reactive<Record<string, string>>({})

// 🔥 CONTROL DE CARGA - EVITAR MÚLTIPLES LLAMADAS
const loadingImages = new Set<string>() // Canales que ya se están cargando
const loadedChannels = new Set<string>() // Canales que ya tienen imagen (éxito o fallback)

const DEFAULT_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#1a1a2e"/><text x="60" y="65" text-anchor="middle" fill="#1db954" font-size="40" font-family="Arial">♪</text></svg>'
)

const popularArtists = artistDiscoveryService.getPopularArtists()
const favoriteArtists = computed(() => artistStore.favoriteArtists)

// Caché de mixes
const MIXES_CACHE_KEY = 'cachedArtistMixes'

const loadCachedMixes = () => {
    try {
        const cached = localStorage.getItem(MIXES_CACHE_KEY)
        if (cached) cachedMixes.value = JSON.parse(cached)
    } catch { /* silencioso */ }
}

const saveMixesToCache = (mixes: any[]) => {
    try {
        const allMixes = [...cachedMixes.value, ...mixes]
        const unique = allMixes.filter((mix, index, self) =>
            index === self.findIndex(m => m.name === mix.name)
        )
        localStorage.setItem(MIXES_CACHE_KEY, JSON.stringify(unique.slice(0, 10)))
        cachedMixes.value = unique.slice(0, 10)
    } catch { /* silencioso */ }
}

const clearCachedMixes = () => {
    localStorage.removeItem(MIXES_CACHE_KEY)
    cachedMixes.value = []
}

// 🔥 NUEVO: Cargar imagen de forma CONTROLADA (máximo 3 simultáneas)
const imageQueue: Array<() => Promise<void>> = []
let activeImageLoads = 0
const MAX_IMAGE_LOADS = 3

const processImageQueue = async () => {
    if (activeImageLoads >= MAX_IMAGE_LOADS || imageQueue.length === 0) return

    activeImageLoads++
    const task = imageQueue.shift()!

    try {
        await task()
    } catch {
        // Silencioso
    } finally {
        activeImageLoads--
        processImageQueue() // Procesar siguiente
    }
}

const loadArtistImage = (name: string, channelId: string, thumbnail?: string) => {
    // 1. Si ya se cargó (éxito o fallback), no hacer nada
    if (loadedChannels.has(channelId)) return

    // 2. Si ya se está cargando, no duplicar
    if (loadingImages.has(channelId)) return

    // 3. Si ya está en caché, marcarlo como cargado
    if (imageCache[channelId]) {
        loadedChannels.add(channelId)
        return
    }

    // 4. Si tiene thumbnail de Firebase, usarlo directamente
    if (thumbnail && (thumbnail.startsWith('http') || thumbnail.startsWith('https'))) {
        imageCache[channelId] = thumbnail
        loadedChannels.add(channelId)
        return
    }

    // 5. Encolar carga (MÁXIMO 3 simultáneas)
    loadingImages.add(channelId)
    loadedChannels.add(channelId) // Marcar para no reintentar

    const task = async () => {
        try {
            if (channelId && (window as any).electron?.ipcRenderer?.invoke) {
                const info = await (window as any).electron.ipcRenderer.invoke(
                    'youtube-channel-info',
                    channelId
                )
                if (info?.thumbnail) {
                    imageCache[channelId] = info.thumbnail
                    return
                }
            }
            // Fallback
            const nameToUse = name && name !== 'YT' ? name : channelId?.substring(0, 2) || 'YT'
            imageCache[channelId] = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameToUse)}&background=1a1a2e&color=1db954&size=120&bold=true&format=svg`
        } catch {
            const nameToUse = name && name !== 'YT' ? name : 'YT'
            imageCache[channelId] = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameToUse)}&background=1a1a2e&color=1db954&size=120&bold=true&format=svg`
        } finally {
            loadingImages.delete(channelId)
        }
    }

    imageQueue.push(task)
    processImageQueue()
}

// ✅ SÍNCRONO - Solo devuelve del caché, NO dispara cargas
const getArtistImage = (name: string, channelId?: string, thumbnail?: string): string => {
    const id = channelId || name

    // Si está en caché reactivo, devolver
    if (id && imageCache[id]) return imageCache[id]

    // Si tiene thumbnail directo, usarlo
    if (thumbnail && (thumbnail.startsWith('http') || thumbnail.startsWith('https'))) {
        return thumbnail
    }

    return DEFAULT_IMAGE
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
    if (!searchQuery.value) return artists.slice(0, 30)
    const query = searchQuery.value.toLowerCase()
    return artists.filter((a: any) => a.name.toLowerCase().includes(query))
})

const searchOnYouTube = async () => {
    if (!searchQuery.value || searchingOnYoutube.value) return
    searchingOnYoutube.value = true
    youtubeResults.value = []

    try {
        if ((window as any).electron?.ipcRenderer?.invoke) {
            const channels = await (window as any).electron.ipcRenderer.invoke(
                'youtube-search-channels',
                searchQuery.value
            )

            youtubeResults.value = channels.map((ch: any) => {
                const chId = ch.channelId || ch.channel_id
                // Precargar imagen con control
                if (chId) loadArtistImage(ch.name || searchQuery.value, chId, ch.thumbnail)
                return {
                    channelId: chId,
                    name: ch.name || ch.artist_name || searchQuery.value,
                    thumbnail: ch.thumbnail || '',
                    subscriberCount: ch.subscriberCount || ch.subscriber_count || '',
                    verified: ch.verified || false
                }
            })
        }

        if (youtubeResults.value.length === 0) {
            Toastify({
                text: 'No se encontraron canales',
                duration: 2000,
                gravity: 'top',
                position: 'right',
                className: 'toast-glass'
            }).showToast()
        }
    } catch (error) {
        console.error('Error buscando en YouTube:', error)
    } finally {
        searchingOnYoutube.value = false
    }
}

const isArtistFavorite = (channelId: string) => artistStore.isArtistFavorite(channelId)

const getArtistGenre = (name: string): string => {
    const genres: Record<string, string> = {
        'Arautos do Rei': 'Cuarteto', 'Los Heraldos del Rey': 'Cuarteto', 'Trio Legado': 'Trío/Cuarteto',
        'Novo Tom': 'Grupo Vocal', 'Vocal Livre': 'Grupo Vocal', 'Take 6': 'A Cappella/Jazz',
        'Heritage Singers': 'Grupo Coral', 'Felipe Garibo': 'Solista', 'Junior Kelly Marchena': 'Solista',
        'Santiago Benavides': 'Cantautor', 'Leonardo Gonçalves': 'Solista/Vocal', 'Daniela Araújo': 'Pop Cristiano',
        'Edson Nuñez': 'Solista', 'Gadiel Espinoza': 'Solista',
        'Ministerio Shalom': 'Grupo', 'Oasis Ministry': 'Worship',
        'Wintley Phipps': 'Barítono/Gospel', 'Jaime Jorge': 'Violinista', 'Duo Zimrah': 'Dúo',
        'Forgiven': 'Grupo Vocal', 'Aisquel': 'Solista', 'Duo Aisquel': 'Dúo'
    }
    return genres[name] || ''
}

const toggleArtist = async (artist: { name: string; channelId: string; thumbnail?: string }) => {
    if (isArtistFavorite(artist.channelId)) {
        await removeArtist(artist.channelId)
    } else {
        await addArtist(artist)
    }
}

const addArtist = async (artist: { name: string; channelId: string; thumbnail?: string }) => {
    try {
        const img = imageCache[artist.channelId] ||
            artist.thumbnail ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=1a1a2e&color=1db954&size=120`

        await artistStore.addArtist({
            artist_name: artist.name,
            channel_id: artist.channelId,
            thumbnail: img,
            genres: [getArtistGenre(artist.name)].filter(Boolean)
        })
        Toastify({
            text: `✓ ${artist.name} agregado`,
            duration: 2000,
            gravity: 'top',
            position: 'right',
            className: 'toast-glass'
        }).showToast()
    } catch {
        Toastify({
            text: 'Error al agregar',
            duration: 2000,
            gravity: 'top',
            position: 'right',
            className: 'toast-glass bg-danger'
        }).showToast()
    }
}

const removeArtist = async (channelId: string) => {
    try {
        await artistStore.removeArtist(channelId)
        Toastify({
            text: 'Artista eliminado',
            duration: 2000,
            gravity: 'top',
            position: 'right',
            className: 'toast-glass'
        }).showToast()
    } catch (error) {
        console.error('Error eliminando:', error)
    }
}

const generateMixes = async () => {
    if (favoriteArtists.value.length === 0) return
    generating.value = true
    generatedMixes.value = []

    try {
        for (const artist of favoriteArtists.value.slice(0, 4)) {
            const videos = await youtubeScraperService.searchWithoutToken(
                `${artist.artist_name} mejores canciones`
            )
            if (videos.length > 0) {
                generatedMixes.value.push({
                    name: `${artist.artist_name} Mix`,
                    description: `Lo mejor de ${artist.artist_name}`,
                    cover: artist.thumbnail || videos[0]?.thumbnail || '',
                    songs: videos.slice(0, 10)
                })
            }
        }

        if (generatedMixes.value.length > 0) {
            saveMixesToCache(generatedMixes.value)
            Toastify({
                text: `¡${generatedMixes.value.length} mixes generados!`,
                duration: 3000,
                gravity: 'top',
                position: 'right',
                className: 'toast-glass'
            }).showToast()
        }
    } catch (error) {
        console.error('Error generando mixes:', error)
    } finally {
        generating.value = false
    }
}

const playMix = (mix: any) => {
    if (!mix.songs?.length) return
    playerStore.setPlaylist(
        mix.songs.map((s: any) => ({
            video_id: s.videoId || s.video_id,
            video_title: s.title,
            video_thumbnail: s.thumbnail
        })),
        0
    )
}

// 🔥 MONTAJE OPTIMIZADO
onMounted(async () => {
    await artistStore.fetchFavoriteArtists()
    loadCachedMixes()

    // NO PRECARGAR ARTISTAS POPULARES para evitar uso excesivo de búsqueda/scraping
    // Solo cargamos los que ya son favoritos del usuario
    favoriteArtists.value.forEach(artist => {
        if (artist.channel_id) {
            loadArtistImage(artist.artist_name, artist.channel_id, artist.thumbnail)
        }
    })
})
</script>
<style scoped>
/* === Mismos estilos anteriores + nuevos === */

/* Botón de búsqueda en YouTube */
.search-box {
    position: relative;
}

.search-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 0, 0, 0.15);
    border: 1px solid rgba(255, 0, 0, 0.3);
    color: #ff0000;
    border-radius: 8px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
    z-index: 2;
}

.search-btn:hover {
    background: rgba(255, 0, 0, 0.25);
}

/* ... (resto de estilos igual que antes) ... */
.suggestion-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.suggestion-pill {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
}

.suggestion-pill:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--accent-color);
    color: white;
    transform: translateY(-2px);
}

.search-results-section {
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.artist-picker-widget {
    padding: 0.5rem 0;
}

.section-title {
    font-size: 1.1rem;
    font-weight: 400;
}

.section-subtitle {
    color: rgba(255, 255, 255, 0.3);
    font-size: 0.8rem;
    margin: 0.25rem 0 0 0;
}

.btn-accent {
    background: var(--accent-color);
    color: #000;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 500;
    font-size: 0.8rem;
    transition: all 0.2s;
}

.btn-accent:hover:not(:disabled) {
    filter: brightness(1.1);
}

.btn-accent:disabled {
    opacity: 0.6;
}

.favorite-pills-section {
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    padding-bottom: 0.75rem;
}

.favorite-pills-scroll {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.favorite-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(29, 185, 84, 0.08);
    border: 1px solid rgba(29, 185, 84, 0.2);
    border-radius: 20px;
    padding: 0.3rem 0.5rem 0.3rem 0.3rem;
}

.pill-img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
}

.pill-name {
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
}

.pill-remove {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.3);
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    transition: color 0.2s;
}

.pill-remove:hover {
    color: #ff4d4d;
}

.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.3);
    z-index: 2;
}

.search-input {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: white;
    border-radius: 12px;
    padding: 8px 45px 8px 35px;
    font-size: 0.85rem;
}

.search-input:focus {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(29, 185, 84, 0.3);
    box-shadow: none;
}

.search-input::placeholder {
    color: rgba(255, 255, 255, 0.25);
}

.artist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 0.75rem;
    max-height: 300px;
    overflow-y: auto;
    padding-right: 4px;
}

.artist-grid::-webkit-scrollbar {
    width: 4px;
}

.artist-grid::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
}

.artist-card {
    cursor: pointer;
    text-align: center;
    padding: 0.5rem;
    border-radius: 12px;
    transition: all 0.2s;
    border: 2px solid transparent;
}

.artist-card:hover {
    background: rgba(255, 255, 255, 0.04);
}

.artist-card.selected {
    border-color: var(--accent-color);
    background: rgba(29, 185, 84, 0.08);
}

.artist-card-img {
    position: relative;
    width: 65px;
    height: 65px;
    margin: 0 auto 0.4rem;
    border-radius: 50%;
    overflow: hidden;
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
    border-radius: 50%;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.9rem;
}

.artist-card-add-icon {
    position: absolute;
    bottom: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
    opacity: 0;
    transition: opacity 0.2s;
}

.artist-card:hover .artist-card-add-icon {
    opacity: 1;
}

.artist-card-name {
    color: white;
    font-size: 0.72rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.artist-card-genre {
    font-size: 0.6rem;
    color: rgba(255, 255, 255, 0.35);
}

.generated-mixes {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 1rem;
}

.mix-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.mix-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s;
}

.mix-item:hover {
    background: rgba(255, 255, 255, 0.06);
}

.mix-cover {
    width: 45px;
    height: 45px;
    border-radius: 8px;
    object-fit: cover;
}

.mix-info {
    flex: 1;
    min-width: 0;
}

.mix-name {
    color: white;
    font-size: 0.85rem;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mix-desc {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.7rem;
    margin: 0;
}

.mix-count {
    font-size: 0.65rem;
    color: var(--accent-color);
}

.mix-play-icon {
    font-size: 1.5rem;
    color: var(--accent-color);
    opacity: 0.7;
    transition: opacity 0.2s;
}

.mix-item:hover .mix-play-icon {
    opacity: 1;
}

.spin-animation {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.btn-close-mixes {
    border-radius: 50%;
    width: 28px;
    height: 28px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
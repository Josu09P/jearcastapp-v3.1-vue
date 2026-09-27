<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { RecommendedSongModel } from '@/domain/models/RecommendedSongModel'
import { youtubeScraperService } from '@/data/services/youtube/YouTubeScraperService'
import { topicsStorageService } from '@/data/services/local/TopicsStorageService'
import { usePlayerStore } from '@/stores/player-store'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'
import DownloadButton from '@/presentation/widgets/DownloadButton.vue'
import Swal from 'sweetalert2'
import Toastify from 'toastify-js'

export interface TopicCategory {
    id: string
    name: string
    description: string
    query: string
}

const TOPICS: TopicCategory[] = [
    {
        id: 'adrenalina',
        name: 'Adrenalina & Gym',
        description: 'Motivación, workout y alta energía',
        query: 'workout music motivation gym adrenalina'
    },
    {
        id: 'programacion',
        name: 'Programación & Focus',
        description: 'Coding focus, lofi y beats relajantes',
        query: 'music for programming coding focus lofi beats'
    },
    {
        id: 'estudio',
        name: 'Estudio & Concentración',
        description: 'Deep focus, ambient y concentración',
        query: 'study music deep focus chill ambient beats'
    },
    {
        id: 'dormir',
        name: 'Dormir & Relajación',
        description: 'Relajación profunda, ondas delta y calma',
        query: 'sleep music deep relaxation ambient calm'
    },
    {
        id: 'rock_clasico',
        name: 'Rock & Clásicos',
        description: 'Grandes leyendas, himnos y guitarras del rock',
        query: 'classic rock greatest hits legends playlist'
    },
    {
        id: 'pop_latino',
        name: 'Pop & Reggaetón Latino',
        description: 'Ritmo latino, urbano, éxitos de fiesta y pop',
        query: 'exitos urbanos reggaeton pop latino top hits'
    },
    {
        id: 'electronica',
        name: 'Electrónica & EDM',
        description: 'House, electro, festivales y beats electrónicos',
        query: 'electronic dance music festival edm hits house'
    },
    {
        id: 'chillout',
        name: 'Chillout & Acústico',
        description: 'Acústicos suaves, covers y melodías serenas',
        query: 'acoustic chill acoustic guitar pop covers relax'
    },
    {
        id: 'jazz_blues',
        name: 'Jazz & Blues Lounge',
        description: 'Smooth jazz, café lounge y blues envolvente',
        query: 'smooth jazz coffee shop lounge blues background'
    },
    {
        id: 'gaming',
        name: 'Gaming & Synthwave',
        description: 'Retrowave, beats cyberpunk y música para jugar',
        query: 'synthwave retrowave gaming beats phonk'
    },
    {
        id: 'rnb_soul',
        name: 'R&B & Neo Soul',
        description: 'Rhythm and blues, voces cálidas y soul moderno',
        query: 'rnb soul smooth rhythm and blues chill hits'
    },
    {
        id: 'viajes',
        name: 'Carretera & Viajes',
        description: 'Vibras de viaje, indie pop y canciones para la ruta',
        query: 'road trip songs traveling upbeat indie pop classics'
    },
    {
        id: 'cumbia_salsa',
        name: 'Cumbia & Salsa Brava',
        description: 'Ritmo tropical, timba, sonidera y pura fiesta',
        query: 'cumbia sonidera salsa brava clasicos baile fiesta'
    },
    {
        id: 'trap_hiphop',
        name: 'Hip Hop & Trap Urbano',
        description: 'Freestyle, rap potente y beats de trap latino',
        query: 'latin trap hip hop freestyle rap en espanol top'
    },
    {
        id: 'baladas_romanticas',
        name: 'Baladas & Románticas',
        description: 'Baladas doradas en español y clásicos del corazón',
        query: 'baladas romanticas en espanol inolvidables amor'
    },
    {
        id: 'metal_heavy',
        name: 'Metal & Hard Rock',
        description: 'Riffs pesados, guitarras distorsionadas y metal',
        query: 'heavy metal hard rock guitar riffs metalcore playlist'
    },
    {
        id: 'kpop_asian',
        name: 'K-Pop & Asian Hits',
        description: 'Coreografías, idols y los hits de Corea y Asia',
        query: 'kpop hits popular best dance songs asian pop'
    },
    {
        id: 'anime_soundtracks',
        name: 'Anime OST & Épica',
        description: 'Soundtracks legendarios, batalla y nostalgia anime',
        query: 'anime ost epic soundtracks battle theme anime hits'
    },
    {
        id: 'musica_clasica',
        name: 'Clásica & Piano Solo',
        description: 'Obras maestras de orquesta, piano y violín',
        query: 'piano instrumental classical masterpieces chopin debussy'
    },
    {
        id: 'reggae_dub',
        name: 'Reggae & Dub Roots',
        description: 'Good vibes, raíces jamaicanas y dub relajante',
        query: 'reggae roots dub chill positive vibrations jamaica'
    },
    {
        id: 'lofi_hiphop',
        name: 'Lo-Fi Chillhop',
        description: 'Beats nostálgicos para relajarse y desconectar',
        query: 'lofi hip hop radio beats to relax study to chillhop'
    },
    {
        id: 'indie_alternative',
        name: 'Indie & Alternativo',
        description: 'Sonidos frescos independientes y garage rock',
        query: 'indie rock alternative playlist top tracks'
    },
    {
        id: 'fiesta_pachanga',
        name: 'Fiesta & Pachanga',
        description: 'Merengue, bachata y mezclas de fin de semana',
        query: 'fiesta pachanga mix latino para bailar bachata merengue'
    },
    {
        id: 'bossa_nova',
        name: 'Bossa Nova & Café',
        description: 'Acordes brasileños, brisa cálida y serenidad',
        query: 'bossa nova cafe brasil smooth guitar lounge relax'
    }
]

const songs = ref<RecommendedSongModel[]>([])
const currentPlaylistId = ref<string | null>(null)
const currentPlaylistName = ref<string>('')
const loadingSongs = ref(false)
const sortOption = ref<'recent' | 'alphabetical'>('recent')
const showAllPlaylists = ref(true)
const topicsCache = ref<Record<string, RecommendedSongModel[]>>({})

// --- Optimización de Renderizado y Paginación Infinita ---
const displayLimit = ref(20)
const loadingMore = ref(false)
const pageIndex = ref(1)

const visibleSongs = computed(() => {
    return sortedSongs.value.slice(0, displayLimit.value)
})

const loadMore = async (entries: IntersectionObserverEntry[]) => {
    if (!entries[0]?.isIntersecting || loadingSongs.value || loadingMore.value) return

    // 1. Si aún hay canciones indexadas en songs.value que no se muestran, mostrarlas
    if (displayLimit.value < songs.value.length) {
        displayLimit.value += 20
        return
    }

    // 2. Si ya mostramos todas las que hay indexadas, buscar 20 más con yt-dlp e indexarlas
    if (!currentPlaylistId.value) return
    const topic = TOPICS.find(t => t.id === currentPlaylistId.value)
    if (!topic) return

    loadingMore.value = true
    try {
        pageIndex.value++
        const variations = [
            `${topic.name} mejores canciones exitos`,
            `${topic.query} mix tracks`,
            `${topic.name} top hits playlist`,
            `${topic.query} full songs`
        ]
        const nextQuery = variations[(pageIndex.value - 1) % variations.length]
        console.log(`[TOPICS] Paginando más canciones para ${topic.name} usando query: ${nextQuery}`)

        const results = await youtubeScraperService.searchWithoutToken(nextQuery)
        if (results && results.length > 0) {
            const existingIds = new Set(songs.value.map(s => s.video_id))
            const newMapped = results
                .filter(v => !existingIds.has(v.videoId))
                .map(v => ({
                    video_id: v.videoId,
                    video_title: v.title,
                    video_thumbnail: v.thumbnail
                }))

            if (newMapped.length > 0) {
                const updated = await topicsStorageService.appendTopicSongs(currentPlaylistId.value, newMapped)
                songs.value = updated
                topicsCache.value[currentPlaylistId.value] = updated
                displayLimit.value = Math.min(displayLimit.value + 20, updated.length)
            }
        }
    } catch (err) {
        console.error('[TOPICS] Error paginando más canciones del tema:', err)
    } finally {
        loadingMore.value = false
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

// ==================== PORTADAS PERSONALIZADAS Y CARRUSEL DE TEMAS ====================
const TOPIC_IMAGES_KEY = 'jearcast_topic_custom_images'
const topicCustomImages = ref<Record<string, string>>({})
const topicSliderIndices = ref<Record<string, number>>({})
let topicSliderInterval: any = null

const loadTopicImages = () => {
    const stored = localStorage.getItem(TOPIC_IMAGES_KEY)
    if (stored) {
        try {
            topicCustomImages.value = JSON.parse(stored)
        } catch (e) {
            console.error('Error cargando imágenes de temas:', e)
        }
    }
}

const saveTopicImage = (topicId: string, imageData: string) => {
    topicCustomImages.value[topicId] = imageData
    localStorage.setItem(TOPIC_IMAGES_KEY, JSON.stringify(topicCustomImages.value))
}

const compressAndSaveTopicImage = (topicId: string, file: File) => {
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

            const compressedData = canvas.toDataURL('image/jpeg', 0.7)
            saveTopicImage(topicId, compressedData)

            Toastify({
                text: 'Imagen guardada en local (temporal)',
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

const selectTopicImage = async (topicId: string) => {
    try {
        const { value: file } = await Swal.fire({
            title: 'Seleccionar imagen',
            text: 'Elige una imagen para este tema recomendado',
            icon: 'question',
            input: 'file',
            inputAttributes: {
                'accept': 'image/*',
                'aria-label': 'Sube tu imagen'
            },
            showCancelButton: true,
            confirmButtonText: 'Guardar',
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
            compressAndSaveTopicImage(topicId, file)
        }
    } catch (error) {
        console.error('Error al seleccionar imagen del tema:', error)
    }
}

const removeTopicImage = (topicId: string) => {
    delete topicCustomImages.value[topicId]
    localStorage.setItem(TOPIC_IMAGES_KEY, JSON.stringify(topicCustomImages.value))
    Toastify({
        text: 'Portada personalizada eliminada. Carrusel reactivado.',
        duration: 3000,
        className: 'toast-glass',
        gravity: 'top',
        position: 'right'
    }).showToast()
}

const startTopicSlider = () => {
    if (topicSliderInterval) clearInterval(topicSliderInterval)
    topicSliderInterval = setInterval(() => {
        for (const topic of TOPICS) {
            if (!topicCustomImages.value[topic.id]) {
                const list = topicsCache.value[topic.id]
                if (list && list.length > 1) {
                    const current = topicSliderIndices.value[topic.id] || 0
                    topicSliderIndices.value[topic.id] = (current + 1) % list.length
                }
            }
        }
    }, 3500)
}

// Helpers de carátula y conteo para los temas
const getTopicCover = (topicId: string): string => {
    if (topicCustomImages.value[topicId]) {
        return topicCustomImages.value[topicId]
    }
    const list = topicsCache.value[topicId]
    if (list && list.length > 0) {
        const idx = topicSliderIndices.value[topicId] || 0
        const song = list[idx % list.length]
        if (song?.video_thumbnail) return song.video_thumbnail
    }
    return musicBg
}

const getTopicSongCount = (topicId: string): number => {
    return topicsCache.value[topicId]?.length || 0
}

const currentHeroImage = computed(() => {
    if (currentPlaylistId.value) {
        return getTopicCover(currentPlaylistId.value)
    }
    return musicBg
})

// ==================== UTILIDADES ====================
const getLastRecommendedPlaylistId = (): string | null => {
    return localStorage.getItem(LOCAL_RECOMMENDED_KEY)
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

// ==================== CARGAR CANCIONES ====================
const loadSongs = async (topicId: string, topicName: string) => {
    currentPlaylistId.value = topicId
    currentPlaylistName.value = topicName
    showAllPlaylists.value = false
    displayLimit.value = 20
    pageIndex.value = 1
    localStorage.setItem(LOCAL_RECOMMENDED_KEY, topicId)

    // 1. Cargar desde IndexedDB
    const cached = await topicsStorageService.getTopicSongs(topicId)
    if (cached && cached.length > 0) {
        songs.value = cached
        topicsCache.value[topicId] = cached
        setTimeout(() => setupObserver(), 100)
        return
    }

    // 2. Si no hay en IndexedDB, buscar con yt-dlp
    const topic = TOPICS.find(t => t.id === topicId)
    if (!topic) return

    loadingSongs.value = true
    try {
        const results = await youtubeScraperService.searchWithoutToken(topic.query)
        if (results && results.length > 0) {
            const mapped = results.map(v => ({
                video_id: v.videoId,
                video_title: v.title,
                video_thumbnail: v.thumbnail
            }))
            songs.value = mapped
            topicsCache.value[topicId] = mapped
            await topicsStorageService.saveTopicSongs(topicId, mapped)
        } else {
            songs.value = []
        }
        setTimeout(() => setupObserver(), 100)
    } catch (error) {
        console.error('Error cargando canciones del tema:', error)
        songs.value = []
    } finally {
        loadingSongs.value = false
    }
}

// Precarga secuencial en segundo plano para obtener carátulas
const preloadMissingTopics = async () => {
    for (const topic of TOPICS) {
        if (!topicsCache.value[topic.id] || topicsCache.value[topic.id].length === 0) {
            try {
                const cached = await topicsStorageService.getTopicSongs(topic.id)
                if (cached && cached.length > 0) {
                    topicsCache.value[topic.id] = cached
                    continue
                }

                const results = await youtubeScraperService.searchWithoutToken(topic.query)
                if (results && results.length > 0) {
                    const mapped = results.map(v => ({
                        video_id: v.videoId,
                        video_title: v.title,
                        video_thumbnail: v.thumbnail
                    }))
                    topicsCache.value[topic.id] = mapped
                    await topicsStorageService.saveTopicSongs(topic.id, mapped)
                }
            } catch (err) {
                console.warn(`Error preloading topic ${topic.id}:`, err)
            }
        }
    }
}

const refreshTopics = async () => {
    loadingSongs.value = true
    try {
        topicsCache.value = {}
        if (currentPlaylistId.value) {
            await refreshCurrentTopic()
        } else {
            await preloadMissingTopics()
        }
    } finally {
        loadingSongs.value = false
    }
}

const refreshCurrentTopic = async () => {
    if (!currentPlaylistId.value) return
    const topicId = currentPlaylistId.value
    const topic = TOPICS.find(t => t.id === topicId)
    if (!topic) return

    loadingSongs.value = true
    pageIndex.value = 1
    try {
        await topicsStorageService.clearTopicSongs(topicId)
        delete topicsCache.value[topicId]

        const results = await youtubeScraperService.searchWithoutToken(topic.query)
        if (results && results.length > 0) {
            const mapped = results.map(v => ({
                video_id: v.videoId,
                video_title: v.title,
                video_thumbnail: v.thumbnail
            }))
            songs.value = mapped
            topicsCache.value[topicId] = mapped
            await topicsStorageService.saveTopicSongs(topicId, mapped)
            displayLimit.value = 20
        } else {
            songs.value = []
        }
        setTimeout(() => setupObserver(), 100)
    } catch (e) {
        console.error('Error refrescando tema individual:', e)
    } finally {
        loadingSongs.value = false
    }
}

// ==================== ORDENAMIENTO ====================
const sortedSongs = computed(() => {
    if (sortOption.value === 'recent') {
        return [...songs.value]
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
        video_thumbnail: song.video_thumbnail,
        video_author: 'JearCast Music'
    }))
    playerStore.setPlaylist(
        playlist,
        index,
        {
            type: 'recommended',
            id: currentPlaylistId.value!,
            name: currentPlaylistName.value
        },
        true
    )
}

const playAll = () => {
    if (visibleSongs.value.length > 0) {
        playSong(0)
    }
}

// ==================== LIFECYCLE ====================
onMounted(async () => {
    try {
        topicsCache.value = await topicsStorageService.getAllTopicRecords()
    } catch (e) {
        console.error('Error cargando topics cache desde IndexedDB:', e)
    }

    const lastPlaylistId = getLastRecommendedPlaylistId()
    if (lastPlaylistId) {
        const savedTopic = TOPICS.find(t => t.id === lastPlaylistId)
        if (savedTopic) {
            await loadSongs(lastPlaylistId, savedTopic.name)
            return
        }
    }

    // Precargar temas si no se ha seleccionado ninguno
    preloadMissingTopics()

    // Cargar portadas personalizadas y arrancar carrusel dinámico
    loadTopicImages()
    startTopicSlider()
})

onUnmounted(() => {
    if (topicSliderInterval) clearInterval(topicSliderInterval)
    if (observer) observer.disconnect()
})
</script>

<template>
    <DashboardLayout>
        <div class="container-fluid px-0">
            <!-- HERO SECTION CON IMAGEN DE FONDO DINÁMICA -->
            <div v-if="!showAllPlaylists" class="recommended-hero mb-4">
                <div class="hero-bg-layer" :style="{ backgroundImage: `url(${currentHeroImage})` }"></div>
                <div class="hero-overlay">
                    <div class="hero-content px-4">
                        <span class="badge bg-accent mb-2">Tema Recomendado</span>
                        <h1 class="display-4 fw-bold text-white mb-2">{{ currentPlaylistName }}</h1>
                        <div class="d-flex align-items-center gap-3 text-white-50">
                            <span><i class="bi bi-music-note-beamed me-1"></i> {{ songs.length }} Canciones</span>
                        </div>
                        <div class="mt-4 d-flex align-items-center gap-2 flex-wrap" style="position: relative; z-index: 5;">
                            <button @click="playAll" :disabled="songs.length === 0" class="btn btn-accent rounded-pill px-4 py-2 fw-bold">
                                <i class="bi bi-play-fill me-1"></i> Reproducir todo
                            </button>
                            <button @click="showAllPlaylistsView" class="btn-hero-back" title="Volver a temas">
                                <i class="bi bi-arrow-left fs-5"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- HEADER con título y controles (Solo se muestra cuando se ven todas las playlists) -->
            <div v-if="showAllPlaylists" class="d-flex justify-content-between align-items-center mb-4 px-3">
                <div class="d-flex align-items-center gap-3">
                    <h4 class="mb-0 fw-bold" style="color: rgba(255, 255, 255, 0.7);">Temas Recomendados</h4>
                    <span class="badge bg-secondary bg-opacity-25 text-white">yt-dlp</span>
                </div>

                <div class="d-flex gap-2">
                    <button @click="refreshTopics" :disabled="loadingSongs"
                        class="btn-modern-action"
                        title="Sincronizar temas recomendados">
                        <i :class="['bi bi-arrow-clockwise', loadingSongs ? 'spin-animation' : '']"></i>
                        <span>Sincronizar</span>
                    </button>
                </div>
            </div>

            <!-- SECCIÓN DE TEMAS RECOMENDADOS (cards cuadradas) -->
            <div v-if="showAllPlaylists" class="playlists-grid px-3 mb-4">
                <div v-for="topic in TOPICS" :key="topic.id" class="playlist-card-wrapper">
                    <!-- 3 Capas traseras apiladas visibles al ingresar (carta sobre carta) -->
                    <div class="playlist-card-layer playlist-card-layer-3"></div>
                    <div class="playlist-card-layer playlist-card-layer-2"></div>
                    <div class="playlist-card-layer playlist-card-layer-1"></div>

                    <div class="playlist-card" :class="{ 'active': currentPlaylistId === topic.id }"
                        @click="loadSongs(topic.id, topic.name)">

                        <!-- Imagen de fondo con overlay -->
                        <div class="playlist-image-wrapper">
                            <img :src="getTopicCover(topic.id)" :alt="topic.name" class="playlist-image" />

                            <!-- Overlay con blur y botón play -->
                            <div class="playlist-overlay">
                                <button class="play-button"
                                    @click.stop="loadSongs(topic.id, topic.name)">
                                    <i class="bi bi-play-fill"></i>
                                </button>
                            </div>

                            <!-- Badge con número de canciones -->
                            <span class="song-count-badge">
                                <i class="bi bi-music-note-beamed me-1"></i>
                                {{ getTopicSongCount(topic.id) > 0 ? getTopicSongCount(topic.id) : 20 }}+
                            </span>

                            <!-- Botón para cambiar / reemplazar portada -->
                            <button class="change-image-btn" @click.stop="selectTopicImage(topic.id)" title="Cambiar portada">
                                <i class="bi bi-camera"></i>
                            </button>

                            <!-- Botón para eliminar imagen personalizada y reactivar carrusel -->
                            <button v-if="topicCustomImages[topic.id]" class="remove-topic-img-btn"
                                @click.stop="removeTopicImage(topic.id)" title="Eliminar imagen y reactivar carrusel">
                                <i class="bi bi-arrow-counterclockwise"></i>
                            </button>
                        </div>

                        <!-- Información del tema -->
                        <div class="playlist-info">
                            <h6 class="playlist-name">{{ topic.name }}</h6>
                            <p class="playlist-description">{{ topic.description }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SPINNER DE CARGA -->
            <div v-if="loadingSongs" class="text-center py-5">
                <div class="spinner-border text-light mb-3" style="width: 2.5rem; height: 2.5rem;" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <h6 class="text-white-50">Explorando y cargando canciones con yt-dlp...</h6>
            </div>

            <!-- CONTENEDOR DEL PLAYER -->
            <div class="text-white rounded shadow mt-4 container-player-jear" id="player-recommended-container"></div>

            <!-- LISTA DE CANCIONES (estilo favoritos/playlists) -->
            <div v-if="!loadingSongs && songs.length > 0" class="mt-4 px-3">
                <!-- Header del tema seleccionado -->
                <div class="topic-header-bar d-flex align-items-center gap-2 gap-sm-3 mb-3">
                    <h5 class="text-white mb-0 text-truncate">{{ currentPlaylistName }}</h5>
                    <span class="badge bg-secondary bg-opacity-25 text-white flex-shrink-0 text-nowrap">
                        {{ songs.length }} {{ songs.length === 1 ? 'canción' : 'canciones' }}
                    </span>
                    <button @click="playAll"
                        class="btn btn-sm btn-outline-light rounded-pill px-3 play-all-button d-flex align-items-center gap-1 flex-shrink-0 text-nowrap">
                        <i class="bi bi-play-fill fs-6"></i>
                        <span class="d-none d-md-inline">Reproducir todo</span>
                    </button>
                    <!-- Controles del tema: Refrescar y Ordenar -->
                    <div class="d-flex align-items-center gap-2 ms-auto flex-shrink-0">
                        <button @click="refreshCurrentTopic" :disabled="loadingSongs"
                            class="btn btn-dark btn-sm border-secondary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                            style="width: 32px; height: 32px; background-color: transparent;"
                            title="Refrescar canciones de este tema">
                            <span v-if="loadingSongs" class="spinner-border spinner-border-sm"></span>
                            <i v-else class="bi bi-arrow-clockwise"></i>
                        </button>
                        <button @click="toggleSortOption"
                            class="btn btn-dark btn-sm border-secondary rounded-pill px-3 flex-shrink-0 text-nowrap d-flex align-items-center gap-1"
                            style="background-color: transparent;">
                            <i :class="sortOption === 'recent' ? 'bi bi-clock-history' : 'bi bi-sort-alpha-down'" />
                            <span class="d-none d-md-inline">{{ sortOption === 'recent' ? 'Recientes' : 'A-Z' }}</span>
                        </button>
                    </div>
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
                                style="width: 48px; height: 48px; object-fit: cover" />
                            <div class="text-truncate">
                                <h6 class="text-white mb-0 text-truncate fw-semibold"
                                    style="font-size: 0.9rem;">
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
                    <!-- Indicador de carga paginada -->
                    <div v-if="loadingMore" class="text-center py-3">
                        <div class="spinner-border spinner-border-sm text-accent" role="status"></div>
                        <span class="ms-2 text-secondary small">Buscando más canciones con yt-dlp...</span>
                    </div>
                    <!-- Centinela para scroll infinito -->
                    <div id="songs-sentinel-recommended" style="height: 20px;"></div>
                </div>
            </div>

            <!-- Estado vacío -->
            <div v-else-if="!showAllPlaylists && !loadingSongs && songs.length === 0" class="text-white-50 p-4 text-center">
                <i class="bi bi-music-note-beamed fs-1 d-block mb-3"></i>
                <p>No se encontraron canciones para este tema.</p>
            </div>
        </div>
    </DashboardLayout>
</template>

<style scoped>
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
.recommended-hero {
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

/* ==================== PLAYLISTS GRID (CARDS COMPACTAS COMO ARTISTAS) ==================== */
.playlists-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
    gap: 1.5rem 1.25rem;
    margin-bottom: 2rem;
}

@media (min-width: 768px) {
    .playlists-grid {
        grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
    }
}

/* Botones de gestión de portada en Topics */
.change-image-btn {
    position: absolute;
    bottom: 8px;
    right: 8px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 3;
    opacity: 0;
}

.playlist-card:hover .change-image-btn {
    opacity: 1;
}

.change-image-btn:hover {
    background: rgba(255, 255, 255, 0.35);
    transform: scale(1.1);
}

.remove-topic-img-btn {
    position: absolute;
    bottom: 8px;
    left: 8px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 3;
    opacity: 0;
}

.playlist-card:hover .remove-topic-img-btn {
    opacity: 1;
}

.remove-topic-img-btn:hover {
    background: rgba(220, 53, 69, 0.85);
    border-color: rgba(220, 53, 69, 1);
    color: #ffffff;
    transform: scale(1.1);
}

.btn-ver-todas {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
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

/* Hover: Animación suave donde las cartas se hacen un poquito más grandes SIN mover las cartas vecinas */
.playlist-card-wrapper:hover .playlist-card {
    transform: scale(1.03);
}

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

.playlist-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 0.8rem;
    filter: none;
    transition: transform 0.4s ease;
}

.playlist-card:hover .playlist-image {
    transform: scale(1.04);
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

/* ==================== BOTONES MODERNOS DE ACCIÓN ==================== */
.btn-modern-action {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-radius: 999px;
    padding: 6px 18px;
    font-size: 0.85rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
    cursor: pointer;
    outline: none;
    text-decoration: none;
}

.btn-modern-action:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.22);
    color: #ffffff;
}

.btn-modern-action:active:not(:disabled) {
    background: rgba(255, 255, 255, 0.14);
}

.btn-modern-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.spin-animation {
    animation: spinAction 1s linear infinite;
}

@keyframes spinAction {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>
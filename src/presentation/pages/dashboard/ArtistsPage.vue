<template>
  <DashboardLayout>
    <div class="artists-page">
      <div class="content-container">

        <!-- BLOQUE 1: MIS ARTISTAS (Solo si hay favoritos) -->
        <section v-if="artistStore.favoriteArtists.length > 0" class="favorites-section mb-5 px-1">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 class="section-title text-white mb-0">
                Tus Artistas
              </h4>
              <p class="text-secondary small mt-1">Tu colección personal de ministerios favoritos.</p>
            </div>
            <div class="d-flex gap-2">
              <button @click="refreshFavorites" class="btn btn-outline-light btn-sm rounded-pill"
                :disabled="artistStore.loading">
                <i :class="['bi bi-arrow-clockwise me-1', artistStore.loading ? 'spin-animation' : '']"></i>
                Sincronizar
              </button>
            </div>
          </div>

          <div class="favorites-grid">
            <div v-for="artist in artistStore.favoriteArtists" :key="artist.channel_id"
              class="favorite-artist-card glass-card">
              <div class="artist-thumb-wrapper">
                <img :src="artist.thumbnail" :alt="artist.artist_name" class="artist-thumb" @error="onArtistImageError">
                <button @click="confirmRemove(artist)" class="remove-btn" title="Eliminar de favoritos">
                  <i class="bi bi-x"></i>
                </button>
              </div>
              <div class="artist-info p-2 text-center">
                <h6 class="artist-name text-truncate px-2">{{ artist.artist_name }}</h6>
                <button @click="generateMixForArtist(artist)" class="btn btn-accent-sm mt-1"
                  :disabled="loadingMix === artist.channel_id">
                  <i
                    :class="['bi me-1', loadingMix === artist.channel_id ? 'bi-hourglass-split spin-animation' : 'bi-magic']"></i>
                  Mix
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- BLOQUE 2: DESCUBRIR Y BUSCAR -->
        <section class="discover-section mb-5">
          <div class="artist-picker-container glass-card overflow-hidden">
            <ArtistPickerWidget />
          </div>
        </section>

        <!-- BLOQUE 3: GALERÍA DE MIXES -->
        <section class="mixes-section px-1">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 class="section-title text-white mb-0">
                <i class="bi bi-magic me-2 text-white"></i>
                Mixes Personalizados
              </h4>
              <p class="text-secondary small mt-1">Mezclas generadas basadas en tu colección.</p>
            </div>
            <button @click="refreshAllMixes" class="btn btn-outline-light btn-sm rounded-pill"
              v-if="artistStore.favoriteArtists.length > 0">
              <i class="bi bi-stars me-1"></i>
              Actualizar Galería
            </button>
          </div>

          <div v-if="loadingMixes" class="text-center py-5 glass-card">
            <div class="spinner-border text-accent" role="status"></div>
            <p class="mt-3 text-secondary">Preparando tus mezclas...</p>
          </div>

          <div v-else-if="cachedMixes.length > 0" class="mix-grid">
            <div v-for="mix in cachedMixes" :key="mix.name" class="mix-card glass-card" @click="playMix(mix)">
              <div class="mix-cover-wrapper">
                <img :src="mix.cover" :alt="mix.name" class="mix-cover" @error="onMixImageError">
                <div class="mix-play-overlay">
                  <i class="bi bi-play-fill"></i>
                </div>
              </div>
              <div class="mix-details p-3">
                <h6 class="mix-name text-truncate">{{ mix.name }}</h6>
                <p class="mix-description text-truncate">{{ mix.description }}</p>
                <span class="mix-meta">{{ mix.songs.length }} canciones</span>
              </div>
            </div>
          </div>

          <div v-else class="empty-state text-center p-5 glass-card">
            <i class="bi bi-music-note-list mb-3 d-block text-secondary" style="font-size: 3rem; opacity: 0.2;"></i>
            <h5>Sin mixes generados</h5>
            <p class="text-secondary">Usa el botón "Mix" en tus artistas favoritos para generar listas personalizadas.
            </p>
          </div>
        </section>

      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'
import ArtistPickerWidget from '@/presentation/widgets/artists/ArtistPickerWidget.vue'
import { useArtistStore } from '@/stores/artist-store'
import { usePlayerStore } from '@/stores/player-store'
import { youtubeScraperService } from '@/data/services/youtube/YouTubeScraperService'
import Toastify from 'toastify-js'

const artistStore = useArtistStore()
const playerStore = usePlayerStore()
const loadingMix = ref('')
const loadingMixes = ref(false)
const cachedMixes = ref<any[]>([])

const MIXES_CACHE_KEY = 'cachedArtistMixes'

const loadCachedMixes = () => {
  try {
    const cached = localStorage.getItem(MIXES_CACHE_KEY)
    if (cached) cachedMixes.value = JSON.parse(cached)
  } catch { /* silencioso */ }
}

const saveMixToCache = (newMix: any) => {
  const existing = [...cachedMixes.value]
  const index = existing.findIndex(m => m.name === newMix.name)
  if (index !== -1) {
    existing[index] = newMix
  } else {
    existing.unshift(newMix)
  }
  cachedMixes.value = existing.slice(0, 15)
  localStorage.setItem(MIXES_CACHE_KEY, JSON.stringify(cachedMixes.value))
}

const refreshFavorites = async () => {
  await artistStore.invalidateAndRefresh()
  Toastify({ text: "Sincronizado con la nube", duration: 2000, className: "toast-glass" }).showToast()
}

const confirmRemove = async (artist: any) => {
  if (confirm(`¿Eliminar a ${artist.artist_name} de tus favoritos?`)) {
    await artistStore.removeArtist(artist.channel_id)
    Toastify({ text: "Artista eliminado", duration: 2000, className: "toast-glass" }).showToast()
  }
}

const generateMixForArtist = async (artist: any) => {
  loadingMix.value = artist.channel_id
  try {
    const videos = await youtubeScraperService.searchWithoutToken(`${artist.artist_name} mejores canciones`)
    if (videos.length > 0) {
      const newMix = {
        name: `${artist.artist_name} Mix`,
        description: `Lo mejor de ${artist.artist_name}`,
        cover: artist.thumbnail || videos[0]?.thumbnail || '',
        songs: videos.slice(0, 15),
        artistId: artist.channel_id
      }
      saveMixToCache(newMix)
      Toastify({ text: `Mix de ${artist.artist_name} generado`, duration: 2000, className: "toast-glass" }).showToast()
    }
  } catch (error) {
    console.error('Error generando mix:', error)
  } finally {
    loadingMix.value = ''
  }
}

const refreshAllMixes = async () => {
  if (artistStore.favoriteArtists.length === 0) return
  loadingMixes.value = true
  try {
    const topArtists = artistStore.favoriteArtists.slice(0, 5)
    for (const artist of topArtists) {
      await generateMixForArtist(artist)
    }
  } finally {
    loadingMixes.value = false
  }
}

const deleteMix = (mixName: string) => {
  cachedMixes.value = cachedMixes.value.filter(m => m.name !== mixName)
  localStorage.setItem(MIXES_CACHE_KEY, JSON.stringify(cachedMixes.value))
  Toastify({ text: "Mix eliminado", duration: 2000, className: "toast-glass" }).showToast()
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
  Toastify({ text: `Reproduciendo ${mix.name}`, duration: 2000, className: "toast-glass" }).showToast()
}

const onArtistImageError = (e: any) => {
  e.target.src = 'https://ui-avatars.com/api/?background=1a1a2e&color=1db954&name=A'
}

const onMixImageError = (e: any) => {
  e.target.src = 'https://ui-avatars.com/api/?name=Mix&background=1a1a2e&color=fff&size=200'
}

onMounted(async () => {
  if (!artistStore.initialized) {
    await artistStore.fetchFavoriteArtists()
  }
  loadCachedMixes()
})
</script>

<style scoped>
.artists-page {
  animation: fadeIn 0.5s ease;
  padding-bottom: 5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  color: white;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.9rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.text-accent {
  color: var(--accent-color) !important;
}

.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
}

/* Favorites Grid */
.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 1.25rem;
}

.favorite-artist-card {
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
}

.favorite-artist-card:hover {
  background: rgba(255, 255, 255, 0.07);
  transform: translateY(-5px);
  border-color: var(--accent-color);
}

.artist-thumb-wrapper {
  position: relative;
  aspect-ratio: 1/1;
  padding: 10px;
}

.artist-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.remove-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(255, 0, 0, 0.2);
  border: none;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
}

.favorite-artist-card:hover .remove-btn {
  opacity: 1;
}

.artist-name {
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.btn-accent-sm {
  background: var(--accent-color);
  color: #000;
  border: none;
  border-radius: 20px;
  padding: 2px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-accent-sm:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: scale(1.05);
}

/* Mix Grid */
.mix-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
}

.mix-card {
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.mix-card:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-5px);
  border-color: var(--accent-color);
}

.mix-cover-wrapper {
  position: relative;
  aspect-ratio: 1/1;
  overflow: hidden;
}

.mix-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.mix-card:hover .mix-cover {
  transform: scale(1.1);
}

.mix-play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.mix-card:hover .mix-play-overlay {
  opacity: 1;
}

.mix-play-overlay i {
  font-size: 2.5rem;
  color: var(--accent-color);
}

.delete-mix-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 0, 0, 0.6);
  border: none;
  color: white;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 10;
}

.mix-card:hover .delete-mix-btn {
  opacity: 1;
}

.delete-mix-btn:hover {
  background: #ff4444;
  transform: scale(1.1);
}

.mix-name {
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.mix-description {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.mix-meta {
  color: var(--accent-color);
  font-size: 0.7rem;
  font-weight: 500;
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

@media (max-width: 768px) {
  .favorites-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.75rem;
  }

  .mix-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>

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
              <button @click="refreshFavorites" class="btn-modern-action"
                :disabled="artistStore.loading" title="Sincronizar tus artistas favoritos">
                <i :class="['bi bi-arrow-clockwise', artistStore.loading ? 'spin-animation' : '']"></i>
                <span>Sincronizar</span>
              </button>
            </div>
          </div>

          <!-- Grilla de Artistas limitada visualmente para evitar saturar la pantalla -->
          <div class="favorites-grid">
            <div v-for="artist in displayedFavoriteArtists" :key="artist.channel_id"
              class="favorite-artist-card"
              @click="handleArtistClick(artist)">
              <!-- Thumbnail circular con overlay play estilo Spotify -->
              <div class="artist-thumb-wrapper">
                <img :src="artist.thumbnail" :alt="artist.artist_name" class="artist-thumb" @error="onArtistImageError">
                <div class="artist-play-hover">
                  <i :class="['bi', loadingMix === artist.channel_id ? 'bi-hourglass-split spin-animation' : 'bi-play-fill']"></i>
                </div>
              </div>

              <!-- Nombre con animación en bucle tipo slider continuo y etiqueta Artista -->
              <div class="artist-info">
                <div class="artist-name-marquee">
                  <div class="marquee-track">
                    <span class="marquee-item">{{ artist.artist_name }}</span>
                    <span class="marquee-item">{{ artist.artist_name }}</span>
                  </div>
                </div>
                <span class="artist-badge">Artista</span>
              </div>

              <!-- Acciones pegadas al extremo derecho: Botón Play (puro icono) y Botón Eliminar (ambos siempre visibles) -->
              <div class="artist-actions" @click.stop>
                <button @click="handleArtistClick(artist)" class="btn-play-circle"
                  :disabled="loadingMix === artist.channel_id"
                  title="Escuchar canciones de este artista">
                  <i :class="['bi', loadingMix === artist.channel_id ? 'bi-hourglass-split spin-animation' : 'bi-play-fill']"></i>
                </button>
                <button @click="confirmRemove(artist)" class="btn-remove-circle" title="Eliminar de favoritos">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Botón Ver Más / Ver Menos para no saturar con demasiadas filas -->
          <div v-if="artistStore.favoriteArtists.length > INITIAL_FAVORITES_LIMIT" class="text-center mt-3">
            <button @click="toggleShowAllArtists" class="btn-modern-action">
              <i :class="showAllFavoriteArtists ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
              <span>{{ showAllFavoriteArtists ? 'Ver menos' : 'Ver más' }}</span>
            </button>
          </div>
        </section>

        <!-- BLOQUE 2: MIX_S PERSONALIZADOS (Directamente debajo de Tus Artistas) -->
        <section class="mixes-section px-1 mb-5">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 class="section-title text-white mb-0 d-flex align-items-center gap-2">
                <i class="bi bi-disc text-accent"></i>
                <span>Mix_s Personalizados</span>
              </h4>
              <p class="text-secondary small mt-1">Mezclas generadas basadas en tu colección.</p>
            </div>
            <button @click="refreshAllMixes" class="btn-modern-action"
              v-if="artistStore.favoriteArtists.length > 0" title="Actualizar la galería de mezclas personalizadas">
              <i :class="['bi bi-arrow-clockwise', loadingMixes ? 'spin-animation' : '']"></i>
              <span>Actualizar Galería</span>
            </button>
          </div>

          <div v-if="loadingMixes" class="text-center py-5 glass-card">
            <div class="spinner-border text-accent" role="status"></div>
            <p class="mt-3 text-secondary">Preparando tus mezclas...</p>
          </div>

          <!-- Grilla con estilo carta sobre carta (3 capas detrás), translúcido con blur y drawer deslizante al hover -->
          <div v-else-if="cachedMixes.length > 0" class="mixes-grid">
            <div v-for="mix in cachedMixes" :key="mix.name" class="mix-card-wrapper" @click="playMix(mix)">
              <!-- 3 Capas traseras apiladas con perspectiva fija (cartas de fondo) -->
              <div class="mix-card-layer mix-card-layer-3"></div>
              <div class="mix-card-layer mix-card-layer-2"></div>
              <div class="mix-card-layer mix-card-layer-1"></div>

              <!-- Tarjeta Principal con desenfoque translúcido (se estira verticalmente al pasar el mouse) -->
              <div class="mix-card">
                <!-- Zona Cuadrada de Portada -->
                <div class="mix-image-wrapper">
                  <img :src="getMixCover(mix)" :alt="mix.name" class="mix-image" @error="onMixImageError" />
                  
                  <!-- Velo permanente para contraste -->
                  <div class="mix-veil"></div>

                  <!-- Overlay al pasar el mouse con botón Play central -->
                  <div class="mix-play-overlay">
                    <button class="mix-play-btn" @click.stop="playMix(mix)" title="Reproducir mix">
                      <i class="bi bi-play-fill"></i>
                    </button>
                  </div>

                  <!-- Badge conteo de canciones con el "+" indicador -->
                  <span class="song-count-badge">
                    <i class="bi bi-music-note-beamed me-1"></i>
                    {{ mix.songs?.length || 0 }}+
                  </span>

                  <!-- Botón para eliminar este mix rápido -->
                  <button class="delete-mix-btn" @click.stop="deleteMix(mix.name)" title="Eliminar mix">
                    <i class="bi bi-trash3"></i>
                  </button>
                </div>

                <!-- Info Drawer: Se desliza desde arriba hacia abajo al pasar el puntero del mouse -->
                <div class="mix-details-slide" @click.stop>
                  <h6 class="mix-name text-truncate" :title="mix.name">{{ mix.name }}</h6>
                  <p class="mix-description text-truncate">{{ mix.description || 'Mix personalizado' }}</p>

                  <!-- Fila de Acciones en el drawer deslizante (3 botones: play, lista, refrescar) -->
                  <div class="mix-actions-row d-flex align-items-center gap-2 pt-1">
                    <button class="btn-mix-action btn-mix-play" @click="playMix(mix)" title="Reproducir">
                      <i class="bi bi-play-fill"></i>
                    </button>
                    <!-- Botón de Lista: Despliega modal para ver/eliminar músicas e indexar -->
                    <button class="btn-mix-action" @click="openMixSongsModal(mix)" title="Ver y gestionar lista de canciones">
                      <i class="bi bi-music-note-list"></i>
                    </button>
                    <button class="btn-mix-action" @click="refreshSingleMix(mix)" title="Refrescar canciones del mix">
                      <i class="bi bi-arrow-clockwise"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state text-center p-5 glass-card">
            <i class="bi bi-disc mb-3 d-block text-secondary" style="font-size: 3rem; opacity: 0.25;"></i>
            <h5>Sin mixes generados</h5>
            <p class="text-secondary">Haz clic en tus artistas favoritos para generar y reproducir listas personalizadas automáticamente.</p>
          </div>
        </section>

      </div>
    </div>

    <!-- BOTÓN FLOTANTE DRAGGABLE (FAB): Se estira al hover y se contrae a icono, estilo blur con borde blanco -->
    <div
      class="artist-floating-fab"
      :style="getFabStyle"
      @mousedown="onFabMouseDown"
      @touchstart="onFabTouchStart"
      @click="handleFabClick"
      title="Arrastra para mover o haz clic para descubrir artistas"
    >
      <i class="bi bi-search fab-icon"></i>
      <span class="fab-text">Descubrir artistas</span>
    </div>

    <!-- MODAL 1: DESCUBRIR ARTISTAS (Efecto Glass blur translúcido medio blanco) -->
    <Teleport to="body">
      <Transition name="fade-modal">
        <div v-if="showDiscoverModal" class="discover-modal-backdrop" @click.self="showDiscoverModal = false">
          <div class="discover-modal-card">
            <!-- Encabezado del Modal -->
            <div class="discover-modal-header d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-2">
                <div class="discover-header-icon">
                  <i class="bi bi-search fs-5 text-white"></i>
                </div>
                <div>
                  <h5 class="mb-0 text-white fw-bold">Descubrir Artistas</h5>
                  <p class="mb-0 text-white-50 small">Explora sugerencias o busca nuevos ministerios musicales</p>
                </div>
              </div>
              <button class="btn-close-modal" @click="showDiscoverModal = false" title="Cerrar ventana">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <!-- Cuerpo del Modal con el Widget de búsqueda y sugerencias -->
            <div class="discover-modal-body">
              <ArtistPickerWidget />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- MODAL 2: GESTIONAR CANCIONES DEL MIX (Ver lista, eliminar canción, refrescar y exportar a playlist) -->
    <Teleport to="body">
      <Transition name="fade-modal">
        <div v-if="selectedMixForModal" class="discover-modal-backdrop" @click.self="closeMixSongsModal">
          <div class="mix-songs-modal-card">
            <!-- Encabezado del Modal con datos del mix y acciones principales -->
            <div class="mix-modal-header p-3 p-md-4 border-bottom border-white border-opacity-10 d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div class="d-flex align-items-center gap-3">
                <img :src="getMixCover(selectedMixForModal)" class="mix-modal-cover" @error="onMixImageError" />
                <div>
                  <h5 class="text-white mb-1 fw-bold">{{ selectedMixForModal.name }}</h5>
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-white bg-opacity-10 text-white border border-white border-opacity-15">
                      {{ selectedMixForModal.songs?.length || 0 }}+ canciones
                    </span>
                    <span class="text-white-50 small text-truncate" style="max-width: 250px;">{{ selectedMixForModal.description }}</span>
                  </div>
                </div>
              </div>

              <div class="d-flex align-items-center gap-2">
                <!-- Botón Reproducir Todo -->
                <button class="btn btn-accent rounded-pill px-3 py-1 btn-sm d-flex align-items-center gap-1"
                  @click="playMix(selectedMixForModal)">
                  <i class="bi bi-play-fill fs-6"></i>
                  <span>Reproducir todo</span>
                </button>
                <!-- Botón Refrescar / Buscar Más -->
                <button class="btn btn-outline-light rounded-pill px-3 py-1 btn-sm d-flex align-items-center gap-1"
                  @click="refreshOrFetchMoreForMix(selectedMixForModal)"
                  :disabled="isRefreshingMixModal"
                  title="Buscar más canciones e indexarlas">
                  <i :class="['bi bi-arrow-clockwise', isRefreshingMixModal ? 'spin-animation' : '']"></i>
                  <span>{{ isRefreshingMixModal ? 'Buscando...' : 'Buscar más' }}</span>
                </button>
                <!-- Botón Exportar a Playlist -->
                <button class="btn btn-outline-light rounded-pill px-3 py-1 btn-sm d-flex align-items-center gap-1"
                  @click="openExportToPlaylist(selectedMixForModal)"
                  title="Guardar este mix como una playlist permanente">
                  <i class="bi bi-folder-plus"></i>
                  <span>Exportar</span>
                </button>
                <!-- Cerrar modal -->
                <button class="btn-close-modal ms-1" @click="closeMixSongsModal" title="Cerrar">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>

            <!-- Subpanel Opcional: Exportar a Playlist -->
            <div v-if="showExportModal" class="export-playlist-drawer p-3 border-bottom border-white border-opacity-10">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="text-white mb-0 fw-semibold d-flex align-items-center gap-2">
                  <i class="bi bi-folder-plus text-accent"></i>
                  <span>Exportar a Playlist Permanente</span>
                </h6>
                <button class="btn btn-sm btn-link text-white-50 p-0 text-decoration-none" @click="showExportModal = false" title="Cerrar panel">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>

              <div class="row g-2 align-items-center">
                <div class="col-12 col-md-4">
                  <select v-model="exportMode" class="export-glass-select">
                    <option value="new">Crear Nueva Playlist</option>
                    <option value="existing" v-if="userDataStore.playlists.length > 0">Agregar a Playlist Existente</option>
                  </select>
                </div>
                <div class="col-12 col-md-5">
                  <input v-if="exportMode === 'new'" v-model="exportPlaylistName" type="text"
                    class="export-glass-input" placeholder="Nombre de la playlist..." />
                  <select v-else v-model="exportSelectedPlaylistId" class="export-glass-select">
                    <option v-for="pl in userDataStore.playlists" :key="pl.id" :value="pl.id">{{ pl.name }}</option>
                  </select>
                </div>
                <div class="col-12 col-md-3">
                  <button class="btn btn-accent btn-sm rounded-pill w-100 py-2 d-flex align-items-center justify-content-center gap-1"
                    @click="handleExportPlaylist(selectedMixForModal)" :disabled="isExportingPlaylist">
                    <span v-if="isExportingPlaylist" class="spinner-border spinner-border-sm me-1"></span>
                    <i v-else class="bi bi-check2"></i>
                    <span>Guardar</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Lista de Canciones del Mix -->
            <div class="mix-modal-body p-3 p-md-4">
              <div v-if="!selectedMixForModal.songs || selectedMixForModal.songs.length === 0" class="text-center py-5 text-white-50">
                <i class="bi bi-music-note-beamed fs-1 mb-2 d-block opacity-25"></i>
                <p>No hay canciones en este mix aún.</p>
              </div>

              <div v-else class="mix-songs-list">
                <div
                  v-for="(song, idx) in selectedMixForModal.songs"
                  :key="song.videoId || song.video_id || idx"
                  class="mix-song-item d-flex align-items-center justify-content-between p-2 rounded mb-2"
                >
                  <div class="d-flex align-items-center gap-3 overflow-hidden flex-grow-1 me-2">
                    <span class="text-white-50 small text-center" style="width: 24px;">{{ idx + 1 }}</span>
                    <img :src="song.thumbnail" class="mix-song-thumb" @error="onMixImageError" />
                    <div class="text-truncate">
                      <p class="mb-0 text-white small fw-medium text-truncate" :title="song.title">{{ song.title }}</p>
                      <span class="text-white-50 extra-small">{{ song.artist || selectedMixForModal.name }}</span>
                    </div>
                  </div>

                  <div class="d-flex align-items-center gap-2 flex-shrink-0">
                    <button class="btn-song-circle-play" @click="playSongFromMix(selectedMixForModal, idx)" title="Reproducir esta canción">
                      <i class="bi bi-play-fill"></i>
                    </button>
                    <!-- Permite eliminar músicas que el usuario no quiera escuchar -->
                    <button class="btn-song-circle-del" @click="removeSongFromMix(selectedMixForModal, song.videoId || song.video_id)" title="Eliminar de este mix">
                      <i class="bi bi-trash3"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'
import ArtistPickerWidget from '@/presentation/widgets/artists/ArtistPickerWidget.vue'
import { useArtistStore } from '@/stores/artist-store'
import { usePlayerStore } from '@/stores/player-store'
import { useUserStore } from '@/stores/user'
import { useUserDataStore } from '@/stores/userDataStore'
import { getArtistSongs } from '@/domain/usecases/artists/GetArtistSongsUseCase'
import { createOrGetPlaylistService, addSongToPlaylistService } from '@/data/services/firestore/PlaylistsFirestore'
import { songExistsInPlaylist } from '@/domain/usecases/playlists/SongExistsInPlaylist'
import Toastify from 'toastify-js'

const artistStore = useArtistStore()
const playerStore = usePlayerStore()
const userStore = useUserStore()
const userDataStore = useUserDataStore()

const loadingMix = ref('')
const loadingMixes = ref(false)
const cachedMixes = ref<any[]>([])

const MIXES_CACHE_KEY = 'cachedArtistMixes_v3'

// ==================== ARTISTAS FAVORITOS (LÍMITE Y VER MÁS) ====================
const INITIAL_FAVORITES_LIMIT = 8
const showAllFavoriteArtists = ref(false)

const displayedFavoriteArtists = computed(() => {
  if (showAllFavoriteArtists.value || artistStore.favoriteArtists.length <= INITIAL_FAVORITES_LIMIT) {
    return artistStore.favoriteArtists
  }
  return artistStore.favoriteArtists.slice(0, INITIAL_FAVORITES_LIMIT)
})

const toggleShowAllArtists = () => {
  showAllFavoriteArtists.value = !showAllFavoriteArtists.value
}

// ==================== SLIDER ROTATIVO DE PORTADAS DE CANCIONES ====================
const mixCoverIndices = ref<Record<string, number>>({})
let mixSliderInterval: any = null

const startMixSlider = () => {
  if (mixSliderInterval) clearInterval(mixSliderInterval)
  mixSliderInterval = setInterval(() => {
    if (!cachedMixes.value || cachedMixes.value.length === 0) return
    for (const mix of cachedMixes.value) {
      if (mix.songs && mix.songs.length > 1) {
        const current = mixCoverIndices.value[mix.name] || 0
        mixCoverIndices.value[mix.name] = (current + 1) % mix.songs.length
      }
    }
  }, 3200)
}

const getMixCover = (mix: any): string => {
  if (mix?.songs && mix.songs.length > 0) {
    const idx = mixCoverIndices.value[mix.name] || 0
    const song = mix.songs[idx % mix.songs.length]
    if (song?.thumbnail) return song.thumbnail
  }
  return mix?.cover || 'https://ui-avatars.com/api/?name=Mix&background=1a1a2e&color=fff&size=200'
}

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
  cachedMixes.value = existing.slice(0, 20)
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

// Al dar clic sobre el artista: reproducir si ya fue generado previamente en cache, o generar si no existe
const handleArtistClick = async (artist: any) => {
  const existingMix = cachedMixes.value.find(m =>
    (m.artistId && m.artistId === artist.channel_id) ||
    (m.name && m.name.toLowerCase().includes(artist.artist_name.toLowerCase()))
  )

  if (existingMix && existingMix.songs?.length > 0) {
    playMix(existingMix)
    return
  }

  // Generar mix y reproducir automáticamente
  await generateMixForArtist(artist, true)
}

const generateMixForArtist = async (artist: any, autoPlay = false) => {
  loadingMix.value = artist.channel_id
  try {
    const songs = await getArtistSongs(artist.artist_name, 20)
    
    if (songs.length > 0) {
      const newMix = {
        name: `Colección de ${artist.artist_name}`,
        description: `Canciones de ${artist.artist_name}`,
        cover: artist.thumbnail || songs[0]?.thumbnail || '',
        artistName: artist.artist_name,
        songs: songs.map((s) => ({
          videoId: s.videoId,
          title: s.title,
          thumbnail: s.thumbnail,
          artist: artist.artist_name
        })),
        artistId: artist.channel_id
      }
      saveMixToCache(newMix)
      Toastify({ text: `Mix de ${artist.artist_name} listo`, duration: 2000, className: "toast-glass" }).showToast()
      if (autoPlay) {
        playMix(newMix)
      }
    } else {
      Toastify({ text: `No se encontraron pistas de ${artist.artist_name}`, duration: 2000, className: "toast-glass bg-danger" }).showToast()
    }
  } catch (error) {
    console.error('Error generando canciones del artista:', error)
  } finally {
    loadingMix.value = ''
  }
}

const refreshAllMixes = async () => {
  if (artistStore.favoriteArtists.length === 0) return
  loadingMixes.value = true
  try {
    // Protección anti-bloqueo IP: sincronizar de forma escalonada un máximo de 3 mezclas
    const targets = cachedMixes.value.length > 0 
      ? cachedMixes.value.slice(0, 3) 
      : artistStore.favoriteArtists.slice(0, 3)

    Toastify({ 
      text: "Sincronizando galería de mezclas de forma segura...", 
      duration: 2500, 
      className: "toast-glass" 
    }).showToast()

    for (let i = 0; i < targets.length; i++) {
      const item = targets[i]
      if ('songs' in item) {
        await refreshSingleMix(item)
      } else {
        await generateMixForArtist(item, false)
      }
      // Cooldown de 1.2 segundos entre consultas para prevenir 429 Too Many Requests
      if (i < targets.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1200))
      }
    }
  } finally {
    loadingMixes.value = false
  }
}

const refreshSingleMix = async (mix: any) => {
  const artistName = mix.artistName || mix.name.replace('Colección de ', '').replace('Mix de ', '')
  try {
    const songs = await getArtistSongs(artistName, 20)
    if (songs.length > 0) {
      mix.songs = songs.map((s) => ({
        videoId: s.videoId,
        title: s.title,
        thumbnail: s.thumbnail,
        artist: artistName
      }))
      saveMixToCache(mix)
      Toastify({ text: `Mix de ${artistName} actualizado`, duration: 2000, className: "toast-glass" }).showToast()
    }
  } catch (err) {
    console.error(err)
  }
}

const deleteMix = (mixName: string) => {
  cachedMixes.value = cachedMixes.value.filter(m => m.name !== mixName)
  localStorage.setItem(MIXES_CACHE_KEY, JSON.stringify(cachedMixes.value))
  if (selectedMixForModal.value?.name === mixName) {
    selectedMixForModal.value = null
  }
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

// ==================== MODAL DE CANCIONES DEL MIX (VER/GESTIONAR) ====================
const selectedMixForModal = ref<any | null>(null)
const isRefreshingMixModal = ref(false)
const showExportModal = ref(false)
const exportMode = ref<'new' | 'existing'>('new')
const exportPlaylistName = ref('')
const exportSelectedPlaylistId = ref('')
const isExportingPlaylist = ref(false)

const openMixSongsModal = (mix: any) => {
  selectedMixForModal.value = mix
  showExportModal.value = false
}

const closeMixSongsModal = () => {
  selectedMixForModal.value = null
  showExportModal.value = false
}

const playSongFromMix = (mix: any, index: number) => {
  if (!mix.songs?.length) return
  playerStore.setPlaylist(
    mix.songs.map((s: any) => ({
      video_id: s.videoId || s.video_id,
      video_title: s.title,
      video_thumbnail: s.thumbnail
    })),
    index
  )
  Toastify({ text: `Reproduciendo ${mix.songs[index].title}`, duration: 2000, className: "toast-glass" }).showToast()
}

const removeSongFromMix = (mix: any, videoId: string) => {
  mix.songs = mix.songs.filter((s: any) => (s.videoId || s.video_id) !== videoId)
  saveMixToCache(mix)
  Toastify({ text: "Canción eliminada del mix", duration: 2000, className: "toast-glass" }).showToast()
}

const refreshOrFetchMoreForMix = async (mix: any) => {
  isRefreshingMixModal.value = true
  try {
    const artistName = mix.artistName || mix.name.replace('Colección de ', '').replace('Mix de ', '')
    const newSongs = await getArtistSongs(artistName, 30)
    if (newSongs.length > 0) {
      const existingIds = new Set(mix.songs.map((s: any) => s.videoId || s.video_id))
      const addedSongs: any[] = []
      for (const s of newSongs) {
        if (!existingIds.has(s.videoId)) {
          addedSongs.push({
            videoId: s.videoId,
            title: s.title,
            thumbnail: s.thumbnail,
            artist: artistName
          })
          existingIds.add(s.videoId)
        }
      }
      mix.songs = [...mix.songs, ...addedSongs]
      saveMixToCache(mix)
      Toastify({ text: `Se indexaron ${addedSongs.length} canciones nuevas`, duration: 2500, className: "toast-glass" }).showToast()
    } else {
      Toastify({ text: "No se encontraron nuevas pistas", duration: 2000, className: "toast-glass" }).showToast()
    }
  } catch (err) {
    console.error(err)
    Toastify({ text: "Error al actualizar", duration: 2000, className: "toast-glass bg-danger" }).showToast()
  } finally {
    isRefreshingMixModal.value = false
  }
}

const openExportToPlaylist = (mix: any) => {
  exportPlaylistName.value = mix.name
  exportSelectedPlaylistId.value = userDataStore.playlists[0]?.id || ''
  showExportModal.value = !showExportModal.value
}

const handleExportPlaylist = async (mix: any) => {
  if (!userStore.id) {
    Toastify({ text: "Inicia sesión para guardar playlists", duration: 2000, className: "toast-glass bg-warning" }).showToast()
    return
  }
  if (!mix.songs?.length) return

  isExportingPlaylist.value = true
  try {
    let targetPlaylistId = ''
    let playlistTitle = ''

    if (exportMode.value === 'new') {
      playlistTitle = exportPlaylistName.value.trim() || mix.name
      targetPlaylistId = await createOrGetPlaylistService({
        name: playlistTitle,
        user_id: userStore.id
      })
    } else {
      targetPlaylistId = exportSelectedPlaylistId.value
      const p = userDataStore.playlists.find(pl => pl.id === targetPlaylistId)
      playlistTitle = p ? p.name : 'Playlist'
    }

    let addedCount = 0
    for (const song of mix.songs) {
      const vId = song.videoId || song.video_id
      const exists = await songExistsInPlaylist(targetPlaylistId, vId)
      if (!exists) {
        await addSongToPlaylistService(targetPlaylistId, {
          video_id: vId,
          video_title: song.title,
          video_thumbnail: song.thumbnail
        })
        addedCount++
      }
    }

    await userDataStore.invalidateAndRefreshPlaylists()
    showExportModal.value = false
    Toastify({
      text: `¡Exportadas ${addedCount} canciones a "${playlistTitle}"!`,
      duration: 3000,
      className: "toast-glass"
    }).showToast()
  } catch (err) {
    console.error(err)
    Toastify({ text: "Error al exportar playlist", duration: 2000, className: "toast-glass bg-danger" }).showToast()
  } finally {
    isExportingPlaylist.value = false
  }
}

// ==================== LÓGICA DE BOTÓN FLOTANTE DRAGGABLE (FAB) ====================
const fabPos = ref({ x: -1, y: -1 })
const isDragging = ref(false)
const hasMoved = ref(false)
const dragStart = ref({ mouseX: 0, mouseY: 0, initialX: 0, initialY: 0 })
const showDiscoverModal = ref(false)

const getFabStyle = computed(() => {
  if (fabPos.value.x === -1 || fabPos.value.y === -1) {
    return {
      right: '28px',
      bottom: '105px'
    }
  }
  return {
    left: `${fabPos.value.x}px`,
    top: `${fabPos.value.y}px`
  }
})

const onFabMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return
  isDragging.value = true
  hasMoved.value = false

  const fabEl = e.currentTarget as HTMLElement
  const rect = fabEl.getBoundingClientRect()
  if (fabPos.value.x === -1) {
    fabPos.value = { x: rect.left, y: rect.top }
  }

  dragStart.value = {
    mouseX: e.clientX,
    mouseY: e.clientY,
    initialX: fabPos.value.x,
    initialY: fabPos.value.y
  }

  window.addEventListener('mousemove', onFabMouseMove)
  window.addEventListener('mouseup', onFabMouseUp)
}

const onFabMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  const dx = e.clientX - dragStart.value.mouseX
  const dy = e.clientY - dragStart.value.mouseY

  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
    hasMoved.value = true
  }

  const fabWidth = 195
  const fabHeight = 48
  const minX = 12
  const maxX = window.innerWidth - fabWidth - 12
  const minY = 50
  const maxY = window.innerHeight - fabHeight - 95

  fabPos.value.x = Math.max(minX, Math.min(maxX, dragStart.value.initialX + dx))
  fabPos.value.y = Math.max(minY, Math.min(maxY, dragStart.value.initialY + dy))
}

const onFabMouseUp = () => {
  isDragging.value = false
  window.removeEventListener('mousemove', onFabMouseMove)
  window.removeEventListener('mouseup', onFabMouseUp)
}

const onFabTouchStart = (e: TouchEvent) => {
  if (!e.touches[0]) return
  isDragging.value = true
  hasMoved.value = false

  const fabEl = e.currentTarget as HTMLElement
  const rect = fabEl.getBoundingClientRect()
  if (fabPos.value.x === -1) {
    fabPos.value = { x: rect.left, y: rect.top }
  }

  dragStart.value = {
    mouseX: e.touches[0].clientX,
    mouseY: e.touches[0].clientY,
    initialX: fabPos.value.x,
    initialY: fabPos.value.y
  }

  window.addEventListener('touchmove', onFabTouchMove, { passive: false })
  window.addEventListener('touchend', onFabTouchEnd)
}

const onFabTouchMove = (e: TouchEvent) => {
  if (!isDragging.value || !e.touches[0]) return
  e.preventDefault()
  const dx = e.touches[0].clientX - dragStart.value.mouseX
  const dy = e.touches[0].clientY - dragStart.value.mouseY

  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
    hasMoved.value = true
  }

  const fabWidth = 195
  const fabHeight = 48
  const minX = 12
  const maxX = window.innerWidth - fabWidth - 12
  const minY = 50
  const maxY = window.innerHeight - fabHeight - 95

  fabPos.value.x = Math.max(minX, Math.min(maxX, dragStart.value.initialX + dx))
  fabPos.value.y = Math.max(minY, Math.min(maxY, dragStart.value.initialY + dy))
}

const onFabTouchEnd = () => {
  isDragging.value = false
  window.removeEventListener('touchmove', onFabTouchMove)
  window.removeEventListener('touchend', onFabTouchEnd)
}

const handleFabClick = () => {
  if (!hasMoved.value) {
    showDiscoverModal.value = true
  }
}

onMounted(async () => {
  if (!artistStore.initialized) {
    await artistStore.fetchFavoriteArtists()
  }
  loadCachedMixes()
  startMixSlider()
})

onUnmounted(() => {
  if (mixSliderInterval) clearInterval(mixSliderInterval)
  window.removeEventListener('mousemove', onFabMouseMove)
  window.removeEventListener('mouseup', onFabMouseUp)
  window.removeEventListener('touchmove', onFabTouchMove)
  window.removeEventListener('touchend', onFabTouchEnd)
})
</script>

<style scoped>
.artists-page {
  animation: fadeIn 0.5s ease;
  padding-bottom: 6rem;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.text-accent {
  color: var(--accent-color) !important;
}

.extra-small {
  font-size: 0.72rem;
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

/* Modern Action Buttons */
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

/* ==================== FAVORITES GRID (TUS ARTISTAS) ==================== */
.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.85rem;
}

.favorite-artist-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.favorite-artist-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.artist-thumb-wrapper {
  position: relative;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
}

.artist-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.artist-play-hover {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 1.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.favorite-artist-card:hover .artist-play-hover {
  opacity: 1;
}

.artist-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.artist-name-marquee {
  overflow: hidden;
  white-space: nowrap;
  position: relative;
  width: 100%;
  mask-image: linear-gradient(to right, black 80%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, black 80%, transparent 100%);
}

.marquee-track {
  display: inline-flex;
  white-space: nowrap;
  will-change: transform;
  animation: artistMarqueeScroll 10s linear infinite;
}

.favorite-artist-card:hover .marquee-track {
  animation-play-state: paused;
}

.marquee-item {
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.2px;
  padding-right: 32px;
  display: inline-block;
}

@keyframes artistMarqueeScroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.artist-badge {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.78rem;
  font-weight: 400;
  margin-top: 2px;
}

.artist-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding-left: 8px;
}

.btn-play-circle {
  background: var(--accent-color, #1db954);
  color: #000000;
  border: none;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  opacity: 1;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.btn-play-circle:hover:not(:disabled) {
  filter: brightness(1.15);
  transform: scale(1.1);
  box-shadow: 0 4px 14px rgba(var(--accent-color-rgb, 29, 185, 84), 0.4);
}

.btn-play-circle:disabled {
  opacity: 0.6;
  cursor: wait;
}

.btn-remove-circle {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.7);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  opacity: 1;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-remove-circle:hover {
  background: rgba(220, 53, 69, 0.25);
  border-color: rgba(220, 53, 69, 0.5);
  color: #ff6b6b;
  transform: scale(1.08);
}

/* ==================== MIX_S PERSONALIZADOS: CARTA SOBRE CARTA Y SLIDE DRAWER ==================== */
.mixes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.85rem 1.4rem;
}

/* Efecto de cartas apiladas */
.mix-card-wrapper {
  position: relative;
  padding-top: 14px;
  padding-right: 14px;
  cursor: pointer;
  user-select: none;
  z-index: 1;
}

.mix-card-wrapper:hover {
  z-index: 40;
}

/* Capas traseras apiladas con efecto translúcido blur */
.mix-card-layer {
  position: absolute;
  border-radius: 16px;
  width: calc(100% - 14px);
  aspect-ratio: 1 / 1;
  pointer-events: none;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Capa 3: La más profunda (4ta carta) */
.mix-card-layer-3 {
  top: 0px;
  right: 0px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 0;
  transform: scale(0.93);
}

/* Capa 2: Intermedia (3ra carta) */
.mix-card-layer-2 {
  top: 6px;
  right: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 1;
  transform: scale(0.96);
}

/* Capa 1: Justo detrás de la principal (2da carta) */
.mix-card-layer-1 {
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 2;
  transform: scale(0.985);
}

/* Carta principal: Translúcida con efecto blur medio blanco (se adapta dinámicamente al tema) */
.mix-card {
  position: relative;
  z-index: 3;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  overflow: visible;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  transition: border-radius 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  display: flex;
  flex-direction: column;
}

.mix-card-wrapper:hover .mix-card {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.25);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

/* Imagen del mix */
.mix-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 15px;
  transition: border-radius 0.2s ease;
}

.mix-card-wrapper:hover .mix-image-wrapper {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.mix-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Velo permanente */
.mix-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%);
  pointer-events: none;
  z-index: 1;
}

/* Overlay play */
.mix-play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
  z-index: 2;
}

.mix-card-wrapper:hover .mix-play-overlay {
  opacity: 1;
}

.mix-play-btn {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background-color: var(--accent-color, #1db954);
  border: none;
  color: #000000;
  font-size: 1.45rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
  padding: 0;
  margin: 0;
}

.mix-play-btn:hover {
  transform: scale(1.12);
  filter: brightness(1.15);
}

/* Badge con cantidad de canciones */
.song-count-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #ffffff;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  z-index: 3;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* Botón eliminar mix de cabecera */
.delete-mix-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 3;
  opacity: 0;
}

.mix-card-wrapper:hover .delete-mix-btn {
  opacity: 1;
}

.delete-mix-btn:hover {
  background: rgba(220, 53, 69, 0.85);
  border-color: rgba(220, 53, 69, 1);
  color: #ffffff;
  transform: scale(1.1);
}

/* ==================== DRAWER DESLIZANTE DE INFORMACIÓN (FLOTANTE SOBRE FILA INFERIOR) ==================== */
.mix-details-slide {
  position: absolute;
  top: calc(100% - 6px);
  left: -1px;
  right: -1px;
  z-index: 50;
  opacity: 0;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0 0 16px 16px;
  padding: 10px 12px 12px 12px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.7);
  transition: opacity 0.22s ease, top 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.mix-card-wrapper:hover .mix-details-slide {
  opacity: 1;
  pointer-events: auto;
  top: calc(100% - 1px);
}

.mix-name {
  color: #ffffff;
  font-size: 0.88rem;
  font-weight: 600;
  margin-bottom: 0.15rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.mix-description {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.72rem;
  margin-bottom: 0.4rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}

/* Fila de acciones dentro del drawer */
.btn-mix-action {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 0;
}

.btn-mix-action:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.45);
  transform: scale(1.1);
}

.btn-mix-play {
  background: var(--accent-color, #1db954);
  border-color: transparent;
  color: #000000;
  font-size: 1.05rem;
}

.btn-mix-play:hover {
  background: var(--accent-color, #1db954);
  filter: brightness(1.15);
  color: #000000;
}

.btn-mix-delete:hover {
  background: rgba(220, 53, 69, 0.35);
  border-color: rgba(220, 53, 69, 0.65);
  color: #ff6b6b;
}

/* ==================== BOTÓN FLOTANTE DRAGGABLE (FAB): EXPANDIBLE Y BLUR ==================== */
.artist-floating-fab {
  position: fixed;
  z-index: 1040;
  cursor: grab;
  user-select: none;
  touch-action: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: #ffffff;
  padding: 0;
  height: 48px;
  width: 48px;
  border-radius: 50%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.2);
  transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              padding 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              border-radius 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              background 0.25s ease,
              border-color 0.25s ease,
              box-shadow 0.25s ease;
  overflow: hidden;
}

.artist-floating-fab:active {
  cursor: grabbing;
}

.artist-floating-fab:hover {
  width: 195px;
  border-radius: 999px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.45);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.artist-floating-fab .fab-icon {
  font-size: 1.15rem;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}

.artist-floating-fab:hover .fab-icon {
  transform: scale(1.1);
}

.artist-floating-fab .fab-text {
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: 0.2px;
  white-space: nowrap;
  opacity: 0;
  max-width: 0;
  overflow: hidden;
  margin-left: 0;
  transition: opacity 0.3s ease, max-width 0.35s cubic-bezier(0.16, 1, 0.3, 1), margin-left 0.35s ease;
}

.artist-floating-fab:hover .fab-text {
  opacity: 1;
  max-width: 140px;
  margin-left: 8px;
}

/* ==================== MODALES ELEGANTE GLASS (BLUR MEDIO BLANCO) ==================== */
.discover-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.discover-modal-card {
  width: 100%;
  max-width: 880px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.25);
  overflow: hidden;
  color: #ffffff;
}

.discover-modal-header {
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  flex-shrink: 0;
}

.discover-header-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close-modal {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.75);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-close-modal:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  transform: scale(1.08);
}

.discover-modal-body {
  overflow-y: auto;
  padding: 1rem 1.5rem 1.5rem;
  flex: 1;
}

/* Modal de Lista de Canciones del Mix */
.mix-songs-modal-card {
  width: 100%;
  max-width: 780px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.25);
  overflow: hidden;
  color: #ffffff;
}

.mix-modal-cover {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

.mix-modal-body {
  overflow-y: auto;
  flex: 1;
}

.mix-song-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;
}

.mix-song-item:hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.14);
}

.mix-song-thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.btn-song-circle-play {
  background: var(--accent-color, #1db954);
  color: #000000;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.btn-song-circle-play:hover {
  transform: scale(1.1);
  filter: brightness(1.15);
}

.btn-song-circle-del {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.65);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-song-circle-del:hover {
  background: rgba(220, 53, 69, 0.3);
  border-color: rgba(220, 53, 69, 0.6);
  color: #ff6b6b;
  transform: scale(1.1);
}

.export-playlist-drawer {
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.export-glass-select,
.export-glass-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  color: #ffffff !important;
  border-radius: 12px;
  padding: 8px 14px;
  font-size: 0.88rem;
  outline: none;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.export-glass-select:focus,
.export-glass-input:focus {
  background: rgba(255, 255, 255, 0.14) !important;
  border-color: rgba(255, 255, 255, 0.45) !important;
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.15);
}

.export-glass-select option {
  background: #181822 !important;
  color: #ffffff !important;
}

.export-glass-input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

/* Transición del Modal */
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
  transform: scale(0.96);
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
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }

  .mixes-grid {
    grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
    gap: 1.25rem 1rem;
  }

  .discover-modal-backdrop {
    padding: 0.75rem;
  }
}
</style>

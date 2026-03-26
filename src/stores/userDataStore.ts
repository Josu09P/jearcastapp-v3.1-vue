import { defineStore } from 'pinia'
import { getFavoritesByUser } from '@/domain/usecases/favorites/GetFavoritesByUser'
import { getPlaylistsByUser } from '@/domain/usecases/playlists/GetPlaylistsByUser'
import { getSongsFromPlaylist } from '@/domain/usecases/playlists/GetSongsFromPlaylist'
import { getRecommendedPlaylists } from '@/domain/usecases/recommended/GetRecommendedPlaylists'

interface UserDataState {
  favorites: any[]
  playlists: any[]
  playlistSongCounts: Record<string, number>
  recommended: any[]
  loading: {
    favorites: boolean
    playlists: boolean
    recommended: boolean
  }
  initialized: {
    favorites: boolean
    playlists: boolean
    recommended: boolean
  }
}

export const useUserDataStore = defineStore('userData', {
  state: (): UserDataState => ({
    favorites: [],
    playlists: [],
    playlistSongCounts: {},
    recommended: [],
    loading: {
      favorites: false,
      playlists: false,
      recommended: false,
    },
    initialized: {
      favorites: false,
      playlists: false,
      recommended: false,
    },
  }),

  actions: {
    getUserId(): string | null {
      const raw = localStorage.getItem('userJearCastInfo')
      if (!raw) return null
      try {
        const parsed = JSON.parse(raw)
        return parsed.id || null
      } catch {
        return null
      }
    },

    // FAVORITOS
    async fetchFavorites(force = false) {
      const userId = this.getUserId()
      if (!userId) return []

      if (!force && this.initialized.favorites) {
        console.log('📦 Usando favoritos del store (ya cargados)')
        return this.favorites
      }

      this.loading.favorites = true
      try {
        console.log('🔄 Cargando favoritos desde Firestore...')
        const favorites = await getFavoritesByUser(userId)
        this.favorites = favorites
        this.initialized.favorites = true
        return favorites
      } catch (error) {
        console.error('Error cargando favoritos:', error)
        throw error
      } finally {
        this.loading.favorites = false
      }
    },

    async invalidateAndRefreshFavorites() {
      this.initialized.favorites = false
      this.favorites = []
      return await this.fetchFavorites(true)
    },

    // PLAYLISTS
    async fetchPlaylists(force = false) {
      const userId = this.getUserId()
      if (!userId) return []

      if (!force && this.initialized.playlists) {
        console.log('📦 Usando playlists del store (ya cargadas)')
        return this.playlists
      }

      this.loading.playlists = true
      try {
        console.log('🔄 Cargando playlists desde Firestore...')
        const playlists = await getPlaylistsByUser(userId)
        this.playlists = playlists

        // ✅ Cargar conteos de canciones para cada playlist
        for (const playlist of this.playlists) {
          if (playlist.id) {
            try {
              const playlistSongs = await getSongsFromPlaylist(playlist.id)
              this.playlistSongCounts[playlist.id] = playlistSongs.length
            } catch (e) {
              console.error(`Error cargando canciones para playlist ${playlist.id}:`, e)
              this.playlistSongCounts[playlist.id] = 0
            }
          }
        }

        this.initialized.playlists = true
        return playlists
      } catch (error) {
        console.error('Error cargando playlists:', error)
        throw error
      } finally {
        this.loading.playlists = false
      }
    },

    async invalidateAndRefreshPlaylists() {
      this.initialized.playlists = false
      this.playlists = []
      this.playlistSongCounts = {}
      return await this.fetchPlaylists(true)
    },

    // ✅ Método para actualizar el conteo de una playlist específica
    async updatePlaylistSongCount(playlistId: string) {
      try {
        const playlistSongs = await getSongsFromPlaylist(playlistId)
        this.playlistSongCounts[playlistId] = playlistSongs.length
        return playlistSongs.length
      } catch (e) {
        console.error(`Error actualizando conteo para playlist ${playlistId}:`, e)
        return 0
      }
    },

    // RECOMENDADOS
    async fetchRecommended(force = false) {
      if (!force && this.initialized.recommended) {
        console.log('📦 Usando recomendados del store (ya cargados)')
        return this.recommended
      }

      this.loading.recommended = true
      try {
        console.log('🔄 Cargando recomendados desde Firestore...')
        const recommended = await getRecommendedPlaylists()
        this.recommended = recommended
        this.initialized.recommended = true
        return recommended
      } catch (error) {
        console.error('Error cargando recomendados:', error)
        throw error
      } finally {
        this.loading.recommended = false
      }
    },

    async invalidateAndRefreshRecommended() {
      this.initialized.recommended = false
      this.recommended = []
      return await this.fetchRecommended(true)
    },
  },

  getters: {
    getPlaylistSongCount: (state) => (playlistId: string) => {
      return state.playlistSongCounts[playlistId] || 0
    },
  },
})

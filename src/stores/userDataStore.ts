import { defineStore } from 'pinia'
import { getFavoritesByUser } from '@/domain/usecases/favorites/GetFavoritesByUser'
import { getPlaylistsByUser } from '@/domain/usecases/playlists/GetPlaylistsByUser'
import { getSongsFromPlaylist } from '@/domain/usecases/playlists/GetSongsFromPlaylist'
import { getRecommendedPlaylists } from '@/domain/usecases/recommended/GetRecommendedPlaylists'

interface UserDataState {
  favorites: any[]
  lastVisibleFavorite: any | null
  hasMoreFavorites: boolean

  playlists: any[]
  playlistSongCounts: Record<string, number>
  lastVisiblePlaylistSong: any | null
  hasMorePlaylistSongs: boolean

  recommended: any[]
  lastVisibleRecommendedSong: any | null
  hasMoreRecommendedSongs: boolean

  loading: {
    favorites: boolean
    playlists: boolean
    recommended: boolean
    playlistSongs: boolean
    recommendedSongs: boolean
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
    lastVisibleFavorite: null,
    hasMoreFavorites: true,

    playlists: [],
    playlistSongCounts: {},
    lastVisiblePlaylistSong: null,
    hasMorePlaylistSongs: true,

    recommended: [],
    lastVisibleRecommendedSong: null,
    hasMoreRecommendedSongs: true,

    loading: {
      favorites: false,
      playlists: false,
      recommended: false,
      playlistSongs: false,
      recommendedSongs: false,
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

    // FAVORITOS CON PAGINACIÓN
    async fetchFavorites(force = false) {
      const userId = this.getUserId()
      if (!userId) return []

      if (!force && this.initialized.favorites) {
        return this.favorites
      }

      this.loading.favorites = true
      try {
        const response = await getFavoritesByUser(userId, 50)
        this.favorites = response.favorites
        this.lastVisibleFavorite = response.lastVisible
        this.hasMoreFavorites = response.favorites.length === 50
        this.initialized.favorites = true
        return this.favorites
      } catch (error) {
        console.error('Error cargando favoritos:', error)
        throw error
      } finally {
        this.loading.favorites = false
      }
    },

    async loadMoreFavorites() {
      if (this.loading.favorites || !this.hasMoreFavorites) return []

      const userId = this.getUserId()
      if (!userId || !this.lastVisibleFavorite) return []

      this.loading.favorites = true
      try {
        const response = await getFavoritesByUser(userId, 50, this.lastVisibleFavorite)
        this.favorites = [...this.favorites, ...response.favorites]
        this.lastVisibleFavorite = response.lastVisible
        this.hasMoreFavorites = response.favorites.length === 50
        return response.favorites
      } catch (error) {
        console.error('Error cargando más favoritos:', error)
        return []
      } finally {
        this.loading.favorites = false
      }
    },

    async invalidateAndRefreshFavorites() {
      this.initialized.favorites = false
      this.favorites = []
      this.lastVisibleFavorite = null
      this.hasMoreFavorites = true
      return await this.fetchFavorites(true)
    },

    // PLAYLISTS - CANCIONES CON PAGINACIÓN
    async fetchSongsFromPlaylist(playlistId: string, force = false) {
      this.loading.playlistSongs = true
      this.lastVisiblePlaylistSong = null
      this.hasMorePlaylistSongs = true

      try {
        const response = await getSongsFromPlaylist(playlistId, 50)
        this.lastVisiblePlaylistSong = response.lastVisible
        this.hasMorePlaylistSongs = response.songs.length === 50
        return response.songs
      } catch (error) {
        console.error('Error cargando canciones:', error)
        return []
      } finally {
        this.loading.playlistSongs = false
      }
    },

    async loadMoreSongsFromPlaylist(playlistId: string) {
      if (this.loading.playlistSongs || !this.hasMorePlaylistSongs) return []

      this.loading.playlistSongs = true
      try {
        const response = await getSongsFromPlaylist(playlistId, 50, this.lastVisiblePlaylistSong)
        this.lastVisiblePlaylistSong = response.lastVisible
        this.hasMorePlaylistSongs = response.songs.length === 50
        return response.songs
      } catch (error) {
        console.error('Error cargando más canciones:', error)
        return []
      } finally {
        this.loading.playlistSongs = false
      }
    },

    // RECOMENDADOS - CANCIONES CON PAGINACIÓN
    async fetchSongsFromRecommended(playlistId: string) {
      this.loading.recommendedSongs = true
      this.lastVisibleRecommendedSong = null
      this.hasMoreRecommendedSongs = true

      try {
        const response = await fetchSongsFromRecommendedPlaylistService(playlistId, 50)
        this.lastVisibleRecommendedSong = response.lastVisible
        this.hasMoreRecommendedSongs = response.songs.length === 50
        return response.songs
      } catch (error) {
        console.error('Error cargando canciones recomendadas:', error)
        return []
      } finally {
        this.loading.recommendedSongs = false
      }
    },

    async loadMoreSongsFromRecommended(playlistId: string) {
      if (this.loading.recommendedSongs || !this.hasMoreRecommendedSongs) return []

      this.loading.recommendedSongs = true
      try {
        const response = await fetchSongsFromRecommendedPlaylistService(playlistId, 50, this.lastVisibleRecommendedSong)
        this.lastVisibleRecommendedSong = response.lastVisible
        this.hasMoreRecommendedSongs = response.songs.length === 50
        return response.songs
      } catch (error) {
        console.error('Error cargando más canciones recomendadas:', error)
        return []
      } finally {
        this.loading.recommendedSongs = false
      }
    },

    // ... (RESTO DE ACCIONES EXISTENTES) ...
    async fetchPlaylists(force = false) {
      const userId = this.getUserId()
      if (!userId) return []

      if (!force && this.initialized.playlists) {
        console.log('Usando playlists del store (ya cargadas)')
        return this.playlists
      }

      this.loading.playlists = true
      try {
        console.log('Cargando playlists desde Firestore...')
        const playlists = await getPlaylistsByUser(userId)
        this.playlists = playlists

        // Cargar conteos de canciones para cada playlist
        for (const playlist of this.playlists) {
          if (playlist.id) {
            try {
              // Ajustado para obtener solo el conteo inicial (puede no ser exacto si hay > 50, 
              // pero para el badge suele bastar o podemos optimizar luego)
              const response = await getSongsFromPlaylist(playlist.id, 50)
              this.playlistSongCounts[playlist.id] = response.songs.length
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

    // Método para actualizar el conteo de una playlist específica
    async updatePlaylistSongCount(playlistId: string) {
      try {
        const response = await getSongsFromPlaylist(playlistId, 50)
        this.playlistSongCounts[playlistId] = response.songs.length
        return response.songs.length
      } catch (e) {
        console.error(`Error actualizando conteo para playlist ${playlistId}:`, e)
        return 0
      }
    },

    // RECOMENDADOS
    async fetchRecommended(force = false) {
      if (!force && this.initialized.recommended) {
        console.log('Usando recomendados del store (ya cargados)')
        return this.recommended
      }

      this.loading.recommended = true
      try {
        console.log('Cargando recomendados desde Firestore...')
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

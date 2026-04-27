import { defineStore } from 'pinia'
import { getFavoriteArtistsUseCase } from '@/domain/usecases/artists/GetFavoriteArtistsUseCase'
import { addFavoriteArtistUseCase } from '@/domain/usecases/artists/AddFavoriteArtistUseCase'
import { removeFavoriteArtistUseCase } from '@/domain/usecases/artists/RemoveFavoriteArtistUseCase'
import type { FavoriteArtistModel } from '@/domain/models/FavoriteArtistModel'

interface ArtistStoreState {
  favoriteArtists: FavoriteArtistModel[]
  loading: boolean
  initialized: boolean
}

export const useArtistStore = defineStore('artistStore', {
  state: (): ArtistStoreState => ({
    favoriteArtists: [],
    loading: false,
    initialized: false,
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

    async fetchFavoriteArtists() {
      const userId = this.getUserId()
      if (!userId) {
        console.log('🎤 No hay usuario, saltando carga de artistas')
        return []
      }

      if (this.initialized && this.favoriteArtists.length > 0) {
        console.log('🎤 Usando artistas del store (ya cargados):', this.favoriteArtists.length)
        return this.favoriteArtists
      }

      this.loading = true
      try {
        console.log('🎤 Cargando artistas favoritos desde Firestore...')
        const response = await getFavoriteArtistsUseCase(userId)
        this.favoriteArtists = response.artists
        this.initialized = true
        console.log(`✅ ${this.favoriteArtists.length} artistas cargados`)
        return this.favoriteArtists
      } catch (error) {
        console.error('❌ Error cargando artistas favoritos:', error)
        return []
      } finally {
        this.loading = false
      }
    },

    async addArtist(artist: {
      artist_name: string
      channel_id: string
      thumbnail: string
      genres: string[]
      user_id?: string
    }) {
      const userId = artist.user_id || this.getUserId()
      if (!userId) {
        console.error('❌ No hay usuario autenticado')
        return 'exists'
      }

      try {
        const result = await addFavoriteArtistUseCase({
          user_id: userId,
          artist_name: artist.artist_name,
          channel_id: artist.channel_id,
          thumbnail: artist.thumbnail,
          genres: artist.genres,
        })

        if (result === 'added') {
          this.favoriteArtists.unshift({
            user_id: userId,
            artist_name: artist.artist_name,
            channel_id: artist.channel_id,
            thumbnail: artist.thumbnail,
            genres: artist.genres,
          })
          console.log(`✅ Artista agregado: ${artist.artist_name}`)
        }

        return result
      } catch (error) {
        console.error('❌ Error agregando artista:', error)
        throw error
      }
    },

    async removeArtist(channelId: string) {
      const userId = this.getUserId()
      if (!userId) return

      try {
        await removeFavoriteArtistUseCase(userId, channelId)
        this.favoriteArtists = this.favoriteArtists.filter((a) => a.channel_id !== channelId)
        console.log('🗑️ Artista eliminado:', channelId)
      } catch (error) {
        console.error('❌ Error eliminando artista:', error)
        throw error
      }
    },

    isArtistFavorite(channelId: string): boolean {
      return this.favoriteArtists.some((a) => a.channel_id === channelId)
    },

    async invalidateAndRefresh() {
      this.initialized = false
      this.favoriteArtists = []
      return await this.fetchFavoriteArtists()
    },

    clearStore() {
      this.initialized = false
      this.favoriteArtists = []
      this.loading = false
      console.log('🎤 ArtistStore: Datos limpiados por cierre de sesión')
    },

    async getMixesFromFavorites(): Promise<any[]> {
      if (this.favoriteArtists.length === 0) return []

      const genresMap = new Map<string, FavoriteArtistModel[]>()
      this.favoriteArtists.forEach((artist) => {
        artist.genres?.forEach((genre) => {
          if (!genresMap.has(genre)) genresMap.set(genre, [])
          genresMap.get(genre)!.push(artist)
        })
      })

      const mixes: any[] = []
      genresMap.forEach((artists, genre) => {
        if (artists.length >= 2) {
          mixes.push({
            name: `${genre} Mix`,
            description: `Basado en ${artists.map((a) => a.artist_name).join(', ')}`,
            artists: artists.map((a) => a.channel_id),
            genre,
          })
        }
      })

      return mixes
    },
  },

  getters: {
    favoriteArtistCount: (state) => state.favoriteArtists.length,
    hasArtists: (state) => state.favoriteArtists.length > 0,
  },
})

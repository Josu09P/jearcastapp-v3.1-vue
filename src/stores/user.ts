import { defineStore } from 'pinia'
import { useArtistStore } from './artist-store'

export const useUserStore = defineStore('user', {
  state: () => ({
    id: '',
    name: 'Usuario',
    email: '',
    apikeyYoutube: '',
    create_at: null as null | string,
  }),
  actions: {
    setUser(user: any) {
      if (!user) return

      this.id = user.id || ''
      this.name = user.name || 'Usuario'
      this.email = user.email || ''
      this.apikeyYoutube = user.apikeyYoutube || ''
      this.create_at = user.create_at || null

      // Solo guardar si hay datos válidos
      if (user.id) {
        localStorage.setItem('userJearCastInfo', JSON.stringify(user))
      }
    },
    loadUserFromLocalStorage() {
      try {
        const data = localStorage.getItem('userJearCastInfo')
        if (data) {
          const user = JSON.parse(data)
          this.setUser(user)
        }
      } catch (err) {
        console.error('Error cargando usuario:', err)
        // Limpiar localStorage corrupto
        localStorage.removeItem('userJearCastInfo')
      }
    },
    logout() {
      this.id = ''
      this.name = 'Usuario'
      this.email = ''
      this.apikeyYoutube = ''
      this.create_at = null

      // Limpiar Stores relacionados
      const artistStore = useArtistStore()
      artistStore.clearStore()

      // Limpiar TODO el localStorage para no dejar rastros de la sesión
      const keysToRemove = [
        'userJearCastInfo',
        'recentlyPlayed',
        'jearcast_selectedPlaylistId',
        'lastRecommendedPlaylistId',
        'cachedMixes',
        'cachedMixesHash',
        'cachedArtistMixes'
      ]
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Forzar recarga para limpiar otros estados en memoria y caches de servicios
      window.location.reload()
    },
  },
})

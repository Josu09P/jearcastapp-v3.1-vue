import { defineStore } from 'pinia'

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

      localStorage.removeItem('userJearCastInfo')
      localStorage.removeItem('recentlyPlayed')
      localStorage.removeItem('jearcast_selectedPlaylistId')
      localStorage.removeItem('lastRecommendedPlaylistId')
      localStorage.removeItem('cachedMixes')
      localStorage.removeItem('cachedMixesHash')
    },
  },
})

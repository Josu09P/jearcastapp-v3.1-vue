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
      this.id = user.id
      this.name = user.name
      this.email = user.email
      this.apikeyYoutube = user.apikeyYoutube
      this.create_at = user.create_at
      localStorage.setItem('userJearCastInfo', JSON.stringify(user))
    },
    loadUserFromLocalStorage() {
      const data = localStorage.getItem('userJearCastInfo')
      if (data) {
        try {
          const user = JSON.parse(data)
          this.setUser(user)
        } catch (err) {
          console.error('Error cargando usuario:', err)
        }
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
    },
  },
})

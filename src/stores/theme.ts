import { defineStore } from 'pinia'

const THEME_KEY = 'app-theme'

interface Theme {
  id: string
  name: string
  class: string
}

export const themes: Theme[] = [
  { id: 'default', name: 'Verde', class: 'theme-default' },
  { id: 'blue', name: 'Azul', class: 'theme-blue' },
  { id: 'pink', name: 'Rosa', class: 'theme-pink' },
  { id: 'purple', name: 'Morado', class: 'theme-purple' },
  { id: 'orange', name: 'Naranja', class: 'theme-orange' },
  { id: 'red', name: 'Rojo', class: 'theme-red' },
  { id: 'cyan', name: 'Celeste', class: 'theme-cyan' },
  { id: 'teal', name: 'Verde Azulado', class: 'theme-teal' },
]

export const useThemeStore = defineStore('theme', {
  state: () => ({
    currentThemeId: localStorage.getItem(THEME_KEY) || 'default',
  }),
  actions: {
    setTheme(themeId: string) {
      const theme = themes.find((t) => t.id === themeId)
      if (theme) {
        // Remover todas las clases de tema
        document.documentElement.classList.remove(...themes.map((t) => t.class))
        // Agregar la nueva clase
        document.documentElement.classList.add(theme.class)
        // Guardar en localStorage
        localStorage.setItem(THEME_KEY, themeId)
        this.currentThemeId = themeId
      }
    },
    loadTheme() {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved) {
        this.setTheme(saved)
      } else {
        this.setTheme('default')
      }
    },
  },
  getters: {
    currentTheme: (state) => themes.find((t) => t.id === state.currentThemeId),
  },
})

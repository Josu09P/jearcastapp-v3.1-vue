import { defineStore } from 'pinia'

const THEME_KEY = 'app-theme'

export interface Theme {
  id: string
  name: string
  class: string
  type: 'gradient' | 'solid'
}

export const themes: Theme[] = [
  // GRADIENT THEMES
  { id: 'default', name: 'Verde', class: 'theme-default', type: 'gradient' },
  { id: 'blue', name: 'Azul', class: 'theme-blue', type: 'gradient' },
  { id: 'pink', name: 'Rosa', class: 'theme-pink', type: 'gradient' },
  { id: 'purple', name: 'Morado', class: 'theme-purple', type: 'gradient' },
  { id: 'orange', name: 'Naranja', class: 'theme-orange', type: 'gradient' },
  { id: 'red', name: 'Rojo', class: 'theme-red', type: 'gradient' },
  { id: 'cyan', name: 'Celeste', class: 'theme-cyan', type: 'gradient' },
  { id: 'teal', name: 'Verde Azulado', class: 'theme-teal', type: 'gradient' },

  // SOLID THEMES
  { id: 'solid-green', name: 'Verde Sólido', class: 'theme-solid-green', type: 'solid' },
  { id: 'solid-blue', name: 'Azul Sólido', class: 'theme-solid-blue', type: 'solid' },
  { id: 'solid-pink', name: 'Rosa Sólido', class: 'theme-solid-pink', type: 'solid' },
  { id: 'solid-purple', name: 'Morado Sólido', class: 'theme-solid-purple', type: 'solid' },
  { id: 'solid-orange', name: 'Naranja Sólido', class: 'theme-solid-orange', type: 'solid' },
  { id: 'solid-red', name: 'Rojo Sólido', class: 'theme-solid-red', type: 'solid' },
  { id: 'solid-cyan', name: 'Celeste Sólido', class: 'theme-solid-cyan', type: 'solid' },
  { id: 'solid-teal', name: 'Verde Azulado Sólido', class: 'theme-solid-teal', type: 'solid' },
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

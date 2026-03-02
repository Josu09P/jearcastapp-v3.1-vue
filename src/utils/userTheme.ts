// utils/useTheme.ts
import { ref } from 'vue'

const THEME_KEY = 'user-theme-color'
const currentThemeColor = ref<string>('')

function applyTheme(color: string) {
  document.documentElement.style.setProperty('--main-bg-color', color)
  localStorage.setItem(THEME_KEY, color)
  currentThemeColor.value = color
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved) {
    applyTheme(saved)
  }
}

export function useTheme() {
  return {
    currentThemeColor,
    applyTheme,
    loadTheme,
  }
}

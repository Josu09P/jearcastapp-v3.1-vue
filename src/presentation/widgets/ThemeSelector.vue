<template>
    <div class="theme-selector">
        <div class="theme-grid">
            <div v-for="theme in themes" :key="theme.id" class="theme-card"
                :class="{ 'is-selected': currentThemeId === theme.id }" @click="setTheme(theme.id)">
                <div class="theme-preview" :class="theme.class"></div>
                <div class="theme-info">
                    <span class="theme-name">{{ theme.name }}</span>
                    <span class="theme-code">{{ getThemeColor(theme.id) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useThemeStore, themes } from '@/stores/theme'
import { storeToRefs } from 'pinia'

const themeStore = useThemeStore()
// Usar storeToRefs para mantener la reactividad
const { currentThemeId } = storeToRefs(themeStore)

const setTheme = (themeId: string) => {
    themeStore.setTheme(themeId)
}

// Obtener el código de color del tema
const getThemeColor = (themeId: string): string => {
    const colors: Record<string, string> = {
        default: '#1db954',
        blue: '#1e88e5',
        pink: '#e91e63',
        purple: '#9c27b0',
        orange: '#ff9800',
        red: '#f44336',
        cyan: '#00bcd4',
        teal: '#009688'
    }
    return colors[themeId] || '#1db954'
}
</script>
<style scoped>
.theme-selector {
    padding: 0;
}

.theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1.25rem;
}

.theme-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent;
}

.theme-card:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
}

.theme-card.is-selected {
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.12);
}

.theme-preview {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 12px;
    margin-bottom: 10px;
    transition: transform 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.theme-card.is-selected .theme-preview {
    transform: scale(1.02);
}

.theme-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: center;
}

.theme-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
}

.theme-code {
    font-size: 0.7rem;
    font-family: 'Monaco', 'Menlo', monospace;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 0.5px;
}

/* Previews de colores - ahora con degradado radial como el fondo real */
.theme-preview.theme-default {
    background: radial-gradient(circle at 20% 30%, rgba(30, 29, 29, 0.879), rgba(5, 5, 5, 1));
}

.theme-preview.theme-blue {
    background: radial-gradient(circle at 20% 30%, rgba(10, 42, 58, 0.95), rgba(5, 5, 5, 1));
}

.theme-preview.theme-pink {
    background: radial-gradient(circle at 20% 30%, rgba(58, 26, 42, 0.95), rgba(5, 5, 5, 1));
}

.theme-preview.theme-purple {
    background: radial-gradient(circle at 20% 30%, rgba(42, 26, 58, 0.95), rgba(5, 5, 5, 1));
}

.theme-preview.theme-orange {
    background: radial-gradient(circle at 20% 30%, rgba(58, 42, 26, 0.95), rgba(5, 5, 5, 1));
}

.theme-preview.theme-red {
    background: radial-gradient(circle at 20% 30%, rgba(58, 26, 26, 0.95), rgba(5, 5, 5, 1));
}

.theme-preview.theme-cyan {
    background: radial-gradient(circle at 20% 30%, rgba(26, 58, 58, 0.95), rgba(5, 5, 5, 1));
}

.theme-preview.theme-teal {
    background: radial-gradient(circle at 20% 30%, rgba(26, 58, 42, 0.95), rgba(5, 5, 5, 1));
}


/* Responsive */
@media (max-width: 768px) {
    .theme-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }
}

@media (max-width: 480px) {
    .theme-grid {
        grid-template-columns: 1fr;
    }
}
</style>
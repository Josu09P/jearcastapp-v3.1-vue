<template>
    <div class="theme-selector">
        <div class="theme-grid">
            <div v-for="theme in filteredThemes" :key="theme.id" class="theme-card"
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
import { computed } from 'vue'

const props = defineProps<{
    type?: 'gradient' | 'solid'
}>()

const themeStore = useThemeStore()
const { currentThemeId } = storeToRefs(themeStore)

const filteredThemes = computed(() => {
    if (!props.type) return themes
    return themes.filter(t => t.type === props.type)
})

const setTheme = (themeId: string) => {
    themeStore.setTheme(themeId)
}

// Obtener el código de color del tema
const getThemeColor = (themeId: string): string => {
    const colors: Record<string, string> = {
        default: '#3e965d',
        blue: '#4a86b9',
        pink: '#c45a82',
        purple: '#8e6bb0',
        orange: '#d68f3e',
        red: '#bc5a5a',
        cyan: '#4b9fa8',
        teal: '#468b81',
        'solid-green': '#3e965d',
        'solid-blue': '#4a86b9',
        'solid-pink': '#c45a82',
        'solid-purple': '#8e6bb0',
        'solid-orange': '#d68f3e',
        'solid-red': '#bc5a5a',
        'solid-cyan': '#4b9fa8',
        'solid-teal': '#468b81'
    }
    return colors[themeId] || '#3e965d'
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

/* SOLID PREVIEWS */
.theme-preview.theme-solid-green { background: #262626; border-bottom: 4px solid #3e965d; }
.theme-preview.theme-solid-blue { background: #0d1a26; border-bottom: 4px solid #4a86b9; }
.theme-preview.theme-solid-pink { background: #260d1b; border-bottom: 4px solid #c45a82; }
.theme-preview.theme-solid-purple { background: #1d0d26; border-bottom: 4px solid #8e6bb0; }
.theme-preview.theme-solid-orange { background: #26170d; border-bottom: 4px solid #d68f3e; }
.theme-preview.theme-solid-red { background: #260d0d; border-bottom: 4px solid #bc5a5a; }
.theme-preview.theme-solid-cyan { background: #0d2626; border-bottom: 4px solid #4b9fa8; }
.theme-preview.theme-solid-teal { background: #0d261a; border-bottom: 4px solid #468b81; }


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
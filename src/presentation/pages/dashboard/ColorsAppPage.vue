<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useTheme } from '@/utils/userTheme'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'
import { animations, useAnimationStore } from '@/stores/animation-store'
import lottie from 'lottie-web'

const colorInput = ref<HTMLInputElement | null>(null)
const { applyTheme, currentThemeColor } = useTheme()
const customColor = ref(currentThemeColor.value)

// Store de animaciones
const animationStore = useAnimationStore()
const selectedAnimation = ref(animationStore.currentAnimationId)

// Referencias para las previsualizaciones
const previewRefs = ref<Record<string, HTMLElement>>({})
const lottieInstances = ref<Record<string, any>>({})

// Función para guardar referencias
const setAnimationRef = (el: any, id: string) => {
    if (el) {
        previewRefs.value[id] = el
    }
}

// Inicializar previsualizaciones
const initPreviews = () => {
    // Limpiar instancias anteriores
    Object.values(lottieInstances.value).forEach(instance => {
        try { instance.destroy() } catch (e) { }
    })
    lottieInstances.value = {}

    // Crear nuevas previsualizaciones
    animations.forEach(anim => {
        const container = previewRefs.value[anim.id]
        if (container) {
            // Limpiar contenedor
            container.innerHTML = ''

            // Crear nueva instancia
            try {
                const instance = lottie.loadAnimation({
                    container: container,
                    renderer: 'svg',
                    loop: true,
                    autoplay: true,
                    animationData: anim.data
                })

                // Reducir velocidad para vista previa
                instance.setSpeed(0.5)

                lottieInstances.value[anim.id] = instance
            } catch (e) {
                console.error(`Error cargando preview para ${anim.id}:`, e)
            }
        }
    })
}

// Cuando se monta el componente
onMounted(() => {
    // Pequeño delay para asegurar que las referencias estén listas
    setTimeout(() => {
        initPreviews()
    }, 100)
})

// Limpiar al desmontar
onBeforeUnmount(() => {
    Object.values(lottieInstances.value).forEach(instance => {
        try { instance.destroy() } catch (e) { }
    })
})

function changeColor(color: string) {
    applyTheme(color)
}

function openColorPicker() {
    (colorInput.value as HTMLInputElement)?.click()
}

function selectAnimation(id: string) {
    selectedAnimation.value = id
    animationStore.setAnimation(id)

    // Disparar evento para recargar animación en el reproductor
    window.dispatchEvent(new CustomEvent('reload-animation'))
}

function resetAnimation() {
    selectedAnimation.value = 'default'
    animationStore.resetToDefault()
    window.dispatchEvent(new CustomEvent('reload-animation'))
}

const isCustomColorSelected = computed(() => {
    return !presetColors.some((c) => c.value === currentThemeColor.value)
})


type ThemeColor = {
    type: 'solid' | 'gradient'
    value: string
    preview: string
}

const presetColors: ThemeColor[] = [
    { type: 'solid', value: '#102c4a', preview: '#102c4a' },
    { type: 'solid', value: '#5d0909', preview: '#5d0909' },
    { type: 'solid', value: '#123c24', preview: '#123c24' },
    { type: 'solid', value: '#4a0958', preview: '#4a0958' },
    { type: 'solid', value: '#c64600', preview: '#c64600' },
    { type: 'solid', value: '#1a0101', preview: '#1a0101' },
    { type: 'solid', value: '#124242', preview: '#124242' },
    { type: 'solid', value: '#2d0a2e', preview: '#2d0a2e' },
    { type: 'solid', value: '#1b2f0d', preview: '#1b2f0d' },
    { type: 'solid', value: '#0c1c33', preview: '#0c1c33' },
    { type: 'solid', value: '#3b1f07', preview: '#3b1f07' },
    { type: 'solid', value: '#470029', preview: '#470029' },
    { type: 'solid', value: '#003c3c', preview: '#003c3c' },
    { type: 'solid', value: '#2f0e0e', preview: '#2f0e0e' },
    { type: 'solid', value: '#1c0d2f', preview: '#1c0d2f' },
    { type: 'solid', value: '#3a3a00', preview: '#3a3a00' },
    { type: 'solid', value: '#0d0b3e', preview: '#0d0b3e' },
    { type: 'solid', value: '#180c22', preview: '#180c22' },
    { type: 'solid', value: '#1c1b55', preview: '#1c1b55' },
    { type: 'solid', value: '#112a46', preview: '#112a46' },
    { type: 'solid', value: '#1b2631', preview: '#1b2631' },
    { type: 'solid', value: '#173017', preview: '#173017' },
    { type: 'solid', value: '#362202', preview: '#362202' },
    { type: 'solid', value: '#3d000f', preview: '#3d000f' },
    { type: 'solid', value: '#4c1036', preview: '#4c1036' },
    { type: 'solid', value: '#1ed760', preview: '#1ed760' },
    { type: 'gradient', value: '#3f0d12', preview: 'linear-gradient(135deg, #3f0d12, #a71d31)' },
    { type: 'gradient', value: '#1f1c2c', preview: 'linear-gradient(135deg, #1f1c2c, #928dab)' },
    { type: 'gradient', value: '#232526', preview: 'linear-gradient(135deg, #232526, #414345)' },
    { type: 'gradient', value: '#0f2027', preview: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' },
    { type: 'gradient', value: '#000000', preview: 'linear-gradient(135deg, #000000, #434343)' },
    { type: 'gradient', value: '#2c3e50', preview: 'linear-gradient(135deg, #2c3e50, #4ca1af)' },
    { type: 'gradient', value: '#000428', preview: 'linear-gradient(135deg, #000428, #004e92)' },
    { type: 'gradient', value: '#1e130c', preview: 'linear-gradient(135deg, #1e130c, #9a8478)' },
    { type: 'gradient', value: '#141e30', preview: 'linear-gradient(135deg, #141e30, #243b55)' }
]
</script>

<template>
    <DashboardLayout>
        <div class="theme-container">
            <!-- SECCIÓN 1: COLORES -->
            <header class="theme-header">
                <div class="header-content">
                    <h4 class="title">Apariencia</h4>
                    <p class="subtitle">Personaliza el color de acento de tu interfaz</p>
                </div>

                <button class="custom-picker-tile" @click="openColorPicker" :class="{ active: isCustomColorSelected }">
                    <div class="picker-preview"
                        :style="{ background: isCustomColorSelected ? customColor : 'transparent' }">
                        <img src="@/assets/img/colors-svgrepo-com.svg" alt="Custom" />
                    </div>
                    <span>Personalizado</span>
                    <input ref="colorInput" type="color" v-model="customColor" @input="changeColor(customColor)"
                        class="hidden-input" />
                </button>
            </header>

            <div class="color-grid">
                <div v-for="color in presetColors" :key="color.preview" class="color-card"
                    :class="{ 'is-selected': color.value === currentThemeColor }" @click="changeColor(color.value)">
                    <div class="color-fill" :style="{ background: color.preview }">
                        <div class="check-icon" v-if="color.value === currentThemeColor">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                    </div>
                    <div class="color-info">
                        <span class="color-type">{{ color.type }}</span>
                        <span class="color-hex">{{ color.value.toUpperCase() }}</span>
                    </div>
                </div>
            </div>

            <!-- LÍNEA SEPARADORA -->
            <div class="section-divider"></div>

            <!-- SECCIÓN 2: ANIMACIONES DEL REPRODUCTOR -->
            <section class="animation-section">
                <header class="section-header">
                    <div class="header-content">
                        <h4 class="title">Reproductor</h4>
                        <p class="subtitle">Animación de reproducción en modo mini</p>
                    </div>
                    <button class="reset-button" @click="resetAnimation" v-if="selectedAnimation !== 'default'">
                        <i class="bi bi-arrow-counterclockwise"></i>
                        Restaurar por defecto
                    </button>
                </header>

                <div class="animation-grid">
                    <div v-for="anim in animations" :key="anim.id" class="animation-card"
                        :class="{ 'is-selected': selectedAnimation === anim.id }" @click="selectAnimation(anim.id)">

                        <!-- Contenedor para la animación Lottie -->
                        <div class="animation-preview">
                            <div :ref="el => setAnimationRef(el, anim.id)" class="lottie-preview"></div>
                        </div>

                        <div class="animation-info">
                            <span class="animation-name">{{ anim.name }}</span>
                            <span class="animation-id" v-if="selectedAnimation === anim.id">
                                <i class="bi bi-check-lg"></i>
                                Seleccionada
                            </span>
                        </div>
                    </div>
                </div>

                <p class="info-note">
                    <i class="bi bi-info-circle"></i>
                    La animación se mostrará en el reproductor mini cuando la música esté sonando
                </p>
            </section>
        </div>
    </DashboardLayout>
</template>

<style scoped>
.theme-container {
    padding: 2rem;
    background: transparent;
    border-radius: 24px;
    border: none;
    width: 100%;
    box-sizing: border-box;
}

/* Header & Custom Picker */
.theme-header,
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1rem;
    flex-wrap: wrap;
}

.title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
}

.subtitle {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
    margin: 4px 0 0 0;
}

.custom-picker-tile {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 16px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: white;
}

.custom-picker-tile:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
}

.custom-picker-tile.active {
    border-color: #fff;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
}

.picker-preview {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.picker-preview img {
    width: 20px;
    height: 20px;
}

/* Grid de Colores */
.color-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1.25rem;
}

.color-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 8px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent;
}

.color-card:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: scale(1.02);
}

.color-card.is-selected {
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.12);
}

.color-fill {
    width: 100%;
    height: 80px;
    border-radius: 10px;
    position: relative;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.color-info {
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.color-type {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.4);
    font-weight: 600;
}

.color-hex {
    font-size: 12px;
    font-family: 'Monaco', monospace;
    color: rgba(255, 255, 255, 0.8);
}

/* Check Icon Overlay */
.check-icon {
    background: rgba(0, 0, 0, 0.2);
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
}

.check-icon svg {
    width: 24px;
    height: 24px;
    color: white;
}

.hidden-input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
}

/* Línea separadora */
.section-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 3rem 0;
}

/* Sección de Animaciones */
.animation-section {
    margin-top: 1rem;
}

.reset-button {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
    padding: 8px 16px;
    border-radius: 30px;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.reset-button:hover {
    border-color: #1db954;
    color: #1db954;
    background: rgba(29, 185, 84, 0.05);
}

.animation-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1.25rem;
    margin-bottom: 1.5rem;
}

.animation-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid transparent;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.animation-card:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
}

.animation-card.is-selected {
    border-color: #1db954;
    background: rgba(29, 185, 84, 0.05);
}

.animation-preview {
    width: 100%;
    aspect-ratio: 1;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-emoji {
    font-size: 3rem;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.animation-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.animation-name {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
    font-weight: 500;
}

.animation-id {
    color: #1db954;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 4px;
}

.animation-id i {
    font-size: 0.8rem;
}

.info-note {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 1.5rem;
    padding: 0.5rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.02);
}

/* Responsive */
@media (max-width: 768px) {
    .theme-container {
        padding: 1rem;
    }

    .theme-header,
    .section-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .custom-picker-tile,
    .reset-button {
        width: 100%;
        justify-content: center;
    }

    .animation-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 480px) {
    .animation-grid {
        grid-template-columns: 1fr;
    }
}
</style>
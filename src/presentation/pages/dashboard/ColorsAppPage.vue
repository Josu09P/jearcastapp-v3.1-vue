<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'
import { animations, useAnimationStore } from '@/stores/animation-store'
import lottie from 'lottie-web'
import ThemeSelector from '@/presentation/widgets/ThemeSelector.vue'

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
</script>

<template>
    <DashboardLayout>
        <div class="theme-container">
            <!-- SECCIÓN 1: TEMAS - REEMPLAZA LOS COLORES -->
            <section class="themes-section">
                <header class="section-header">
                    <div class="header-content">
                        <h4 class="title">Gradientes</h4>
                        <p class="subtitle">Personaliza el color de acento con degradados elegantes</p>
                    </div>
                </header>

                <!-- Aquí va el ThemeSelector para Gradientes -->
                <ThemeSelector type="gradient" />
            </section>

            <div class="section-divider"></div>

            <!-- NUEVA SECCIÓN: COLORES SÓLIDOS -->
            <section class="themes-section">
                <header class="section-header">
                    <div class="header-content">
                        <h4 class="title">Sólidos</h4>
                        <p class="subtitle">Fondos minimalistas y consistentes</p>
                    </div>
                </header>

                <!-- Aquí va el ThemeSelector para Sólidos -->
                <ThemeSelector type="solid" />
            </section>

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
                        Restaurar
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

/* Secciones */
.themes-section,
.animation-section {
    margin-bottom: 2rem;
}

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

/* Línea separadora */
.section-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 2rem 0;
}

/* Sección de Animaciones */
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
    border-color: var(--accent-color);
    /* ✅ Cambiado de #1db954 a variable */
    color: var(--accent-color);
    /* ✅ Cambiado de #1db954 a variable */
    background: rgba(var(--accent-color-rgb, 62, 150, 93), 0.05);
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
    border-color: var(--accent-color);
    /* ✅ Cambiado de #1db954 a variable */
    background: rgba(var(--accent-color-rgb, 62, 150, 93), 0.05);
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

.lottie-preview {
    width: 100%;
    height: 100%;
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
    color: var(--accent-color);
    /* ✅ Cambiado de #1db954 a variable */
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

    .section-header {
        flex-direction: column;
        align-items: flex-start;
    }

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
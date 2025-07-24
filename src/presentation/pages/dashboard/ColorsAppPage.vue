<template>
    <DashboardLayout>
        <div class="theme-selector">
            <h4 class="mb-3 text-white">Colores</h4>
            <div class="color-options">
                <button v-for="color in presetColors" :key="color.preview" :style="{ background: color.preview }"
                    class="color-button" :class="{ selected: color.value === currentThemeColor }"
                    @click="changeColor(color.value)">
                    <span v-if="color.value === currentThemeColor">✔️</span>
                </button>

                <button class="color-button palette-img-button" @click="openColorPicker"
                    :class="{ selected: isCustomColorSelected }">
                    <img src="@/assets/img/colors-svgrepo-com.svg" alt="Custom color" />
                    <input ref="colorInput" type="color" v-model="customColor" @input="changeColor(customColor)" />
                    <span v-if="isCustomColorSelected">✔️</span>
                </button>
            </div>
        </div>
    </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTheme } from '@/utils/userTheme'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'
const colorInput = ref<HTMLInputElement | null>(null)
const { applyTheme, currentThemeColor } = useTheme()
const customColor = ref(currentThemeColor.value)

function changeColor(color: string) {
    applyTheme(color)
}
function openColorPicker() {
    (colorInput.value as HTMLInputElement)?.click()
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
    { type: 'solid', value: '#1b1b1b', preview: '#1b1b1b' },
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

<style scoped>
.theme-selector {
    padding: 1.5rem;
    border-radius: 1rem;
    backdrop-filter: blur(10px);
    color: white;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.color-options {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.color-button {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.1);
    outline: none;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.3s, border 0.3s;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;
}

.color-button:hover {
    transform: scale(1.15);
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.25);
}

.color-button span {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.5rem;
    color: white;
    text-shadow: 0 0 5px black;
}

.color-button.selected {
    border: 3px solid white;
    box-shadow: 0 0 10px white;
}

.palette-img-button {
    background: transparent;
    padding: 0;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.palette-img-button img {
    width: 38px;
    height: 38px;
    border-radius: 50%;
}


.palette-img-button input[type="color"] {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
}
</style>
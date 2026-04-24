<template>
    <div class="audio-control-wrapper">
        <!-- Botón de volumen -->
        <div class="volume-control" @mouseenter="showVolumePanel = true" @mouseleave="showVolumePanel = false">
            <button class="volume-btn" :class="{ active: volume !== 100 }">
                <i :class="volumeIcon"></i>
            </button>

            <!-- Panel deslizable de volumen -->
            <Transition name="slide-up">
                <div v-if="showVolumePanel" class="volume-panel">
                    <input type="range" v-model="volume" min="0" max="100" step="1" class="volume-slider vertical"
                        @input="updateVolume" />
                    <span class="volume-value">{{ volume }}%</span>
                </div>
            </Transition>
        </div>

        <!-- Botón de ecualizador (abre panel de EQ) -->
        <div class="eq-control">
            <button @click="toggleEqPanel" class="eq-btn" :class="{ active: isEqActive }">
                <i class="bi bi-sliders2"></i>
            </button>

            <!-- Panel de ecualizador -->
            <Transition name="slide-up">
                <div v-if="showEqPanel" class="eq-panel">
                    <div class="eq-header">
                        <span>Ecualizador</span>
                        <button @click="resetEq" class="reset-eq-btn">Reset</button>
                    </div>

                    <!-- Bajos -->
                    <div class="eq-slider-group">
                        <label class="eq-label">
                            <i class="bi bi-soundwave"></i>
                            <span>Bajos</span>
                        </label>
                        <input type="range" v-model="bass" min="-12" max="12" step="0.5" class="eq-slider"
                            @input="updateEq" />
                        <span class="eq-value">{{ bass > 0 ? '+' : '' }}{{ bass }} dB</span>
                    </div>

                    <!-- Medios -->
                    <div class="eq-slider-group">
                        <label class="eq-label">
                            <i class="bi bi-graph-up"></i>
                            <span>Medios</span>
                        </label>
                        <input type="range" v-model="mid" min="-12" max="12" step="0.5" class="eq-slider"
                            @input="updateEq" />
                        <span class="eq-value">{{ mid > 0 ? '+' : '' }}{{ mid }} dB</span>
                    </div>

                    <!-- Agudos -->
                    <div class="eq-slider-group">
                        <label class="eq-label">
                            <i class="bi bi-treble"></i>
                            <span>Agudos</span>
                        </label>
                        <input type="range" v-model="treble" min="-12" max="12" step="0.5" class="eq-slider"
                            @input="updateEq" />
                        <span class="eq-value">{{ treble > 0 ? '+' : '' }}{{ treble }} dB</span>
                    </div>

                    <!-- Presets rápidos -->
                    <div class="eq-presets">
                        <div class="presets-label">Presets:</div>
                        <div class="presets-buttons">
                            <button @click="applyPreset('flat')" class="preset-btn">Plano</button>
                            <button @click="applyPreset('bass')" class="preset-btn">Bajos+</button>
                            <button @click="applyPreset('treble')" class="preset-btn">Agudos+</button>
                            <button @click="applyPreset('vocal')" class="preset-btn">Vocal</button>
                        </div>
                    </div>

                    <!-- Reducción de ruido (opcional) -->
                    <div class="eq-toggle" v-if="showNoiseReduction">
                        <label class="toggle-label">
                            <span>🔇 Reducción de ruido</span>
                            <label class="toggle-switch">
                                <input type="checkbox" v-model="noiseReduction" @change="updateNoiseReduction">
                                <span class="toggle-slider"></span>
                            </label>
                        </label>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const emit = defineEmits<{
    (e: 'volume-change', value: number): void
    (e: 'eq-change', values: { bass: number; mid: number; treble: number; noiseReduction: boolean }): void
}>()

// Estado
const showVolumePanel = ref(false)
const showEqPanel = ref(false)
const showNoiseReduction = ref(false)

// Valores de audio
const volume = ref(80)
const bass = ref(0)
const mid = ref(0)
const treble = ref(0)
const noiseReduction = ref(false)

// Computed para el ícono de volumen
const volumeIcon = computed(() => {
    if (volume.value === 0) return 'bi bi-volume-mute'
    if (volume.value < 30) return 'bi bi-volume-off'
    if (volume.value < 70) return 'bi bi-volume-down'
    return 'bi bi-volume-up'
})

const isEqActive = computed(() => {
    return bass.value !== 0 || mid.value !== 0 || treble.value !== 0 || noiseReduction.value
})

// Actualizar volumen
const updateVolume = () => {
    emit('volume-change', volume.value)
    // Guardar preferencia
    localStorage.setItem('audio-volume', volume.value.toString())
}

// Actualizar ecualizador
const updateEq = () => {
    emit('eq-change', { bass: bass.value, mid: mid.value, treble: treble.value, noiseReduction: noiseReduction.value })
    // Guardar preferencias
    localStorage.setItem('audio-eq', JSON.stringify({ bass: bass.value, mid: mid.value, treble: treble.value }))
}

const updateNoiseReduction = () => {
    emit('eq-change', { bass: bass.value, mid: mid.value, treble: treble.value, noiseReduction: noiseReduction.value })
    localStorage.setItem('audio-noise-reduction', noiseReduction.value.toString())
}

// Aplicar preset
const applyPreset = (preset: string) => {
    switch (preset) {
        case 'flat':
            bass.value = 0
            mid.value = 0
            treble.value = 0
            break
        case 'bass':
            bass.value = 6
            mid.value = -2
            treble.value = -2
            break
        case 'treble':
            bass.value = -2
            mid.value = 0
            treble.value = 6
            break
        case 'vocal':
            bass.value = -3
            mid.value = 4
            treble.value = 2
            break
    }
    updateEq()
}

const resetEq = () => {
    applyPreset('flat')
}

const toggleEqPanel = () => {
    showEqPanel.value = !showEqPanel.value
    showVolumePanel.value = false
}

// Cargar preferencias guardadas
onMounted(() => {
    const savedVolume = localStorage.getItem('audio-volume')
    if (savedVolume) volume.value = parseInt(savedVolume)

    const savedEq = localStorage.getItem('audio-eq')
    if (savedEq) {
        const eq = JSON.parse(savedEq)
        bass.value = eq.bass ?? 0
        mid.value = eq.mid ?? 0
        treble.value = eq.treble ?? 0
    }

    const savedNoise = localStorage.getItem('audio-noise-reduction')
    if (savedNoise) noiseReduction.value = savedNoise === 'true'

    // Emitir valores iniciales
    updateVolume()
    updateEq()
})
</script>

<style scoped>
.audio-control-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
}

/* Botones */
.volume-btn,
.eq-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.2rem;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.volume-btn:hover,
.eq-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.volume-btn.active,
.eq-btn.active {
    color: var(--accent-color, #3e965d);
}

/* Panel de volumen */
.volume-control {
    position: relative;
}

.volume-panel {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 12px;
    background: rgba(20, 20, 20, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 12px 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    z-index: 200;
}

.volume-slider {
    width: 100px;
    height: 4px;
    -webkit-appearance: none;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    outline: none;
}

.volume-slider.vertical {
    writing-mode: bt-lr;
    -webkit-appearance: slider-vertical;
    width: 4px;
    height: 80px;
}

.volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: var(--accent-color, #3e965d);
    border-radius: 50%;
    cursor: pointer;
}

.volume-value {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
}

/* Panel de ecualizador */
.eq-control {
    position: relative;
}

.eq-panel {
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 12px;
    width: 260px;
    background: rgba(20, 20, 20, 0.98);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 200;
}

.eq-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    font-weight: 500;
    font-size: 0.85rem;
}

.reset-eq-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 12px;
    padding: 4px 12px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.7rem;
    cursor: pointer;
    transition: all 0.2s;
}

.reset-eq-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
}

.eq-slider-group {
    margin-bottom: 14px;
}

.eq-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
}

.eq-label i {
    font-size: 0.9rem;
}

.eq-slider {
    width: 100%;
    height: 3px;
    -webkit-appearance: none;
    background: linear-gradient(to right,
            #ff4444 0%,
            #ffaa44 25%,
            #44ff44 50%,
            #44aaff 75%,
            #aa44ff 100%);
    border-radius: 2px;
    outline: none;
}

.eq-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 10px;
    height: 10px;
    background: white;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.eq-value {
    display: inline-block;
    margin-top: 4px;
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.4);
}

/* Presets */
.eq-presets {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.presets-label {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 8px;
}

.presets-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.preset-btn {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    border-radius: 14px;
    padding: 4px 10px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.65rem;
    cursor: pointer;
    transition: all 0.2s;
}

.preset-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
}

/* Toggle switch */
.eq-toggle {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.toggle-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
}

.toggle-switch {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 18px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.2);
    transition: 0.3s;
    border-radius: 18px;
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
}

input:checked+.toggle-slider {
    background-color: var(--accent-color, #3e965d);
}

input:checked+.toggle-slider:before {
    transform: translateX(18px);
}

/* Animaciones */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

/* Responsive */
@media (max-width: 768px) {
    .eq-panel {
        right: -50px;
        width: 240px;
    }

    .presets-buttons {
        gap: 4px;
    }

    .preset-btn {
        padding: 3px 8px;
        font-size: 0.6rem;
    }
}
</style>
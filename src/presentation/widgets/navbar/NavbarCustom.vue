<template>
    <div class="custom-navbar" v-if="isElectron">
        <div class="left-section">
            <span class="app-title">V.1.2</span>
        </div>

        <div class="right-section">
            <button class="window-btn" title="Minimizar" @click="minimizeWindow" :disabled="!isElectron">
                <i class="bi bi-dash" style="font-size: 16px;"></i>
            </button>
            <button class="window-btn" title="Maximizar/Restaurar" @click="toggleMaximize" :disabled="!isElectron">
                <i class="bi bi-square" style="font-size: 10px;"></i>
            </button>
            <button class="window-btn close" title="Cerrar" @click="closeWindow" :disabled="!isElectron">
                <i class="bi bi-x-lg" style="font-size: 12px;"></i>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

// Detección robusta de Electron
const isElectron = ref(false)
const electronAPI = ref<any>(null)

// Computed para verificar si estamos en Electron de forma segura
const isElectronEnvironment = computed(() => {
    return typeof window !== 'undefined' &&
        window.electron !== undefined &&
        window.electron !== null &&
        window.electron.ipcRenderer !== undefined
})

onMounted(() => {
    // Verificar múltiples formas de detectar Electron
    checkElectronEnvironment()

    // Escuchar si Electron se carga después (útil en desarrollo)
    window.addEventListener('electron-ready', () => {
        checkElectronEnvironment()
    })
})

function checkElectronEnvironment() {
    if (isElectronEnvironment.value) {
        electronAPI.value = window.electron
        isElectron.value = true
        console.log('Electron detectado correctamente')
    } else {
        console.warn('No se detectó Electron, ejecutando en navegador')
        isElectron.value = false
        electronAPI.value = null
    }
}

function minimizeWindow() {
    if (!isElectron.value || !electronAPI.value) {
        console.warn('Función de minimizar no disponible en navegador')
        return
    }

    try {
        // Intentar múltiples métodos de acceso
        if (electronAPI.value.ipcRenderer?.send) {
            electronAPI.value.ipcRenderer.send('window-minimize')
        } else if (electronAPI.value.minimize) {
            electronAPI.value.minimize()
        } else {
            console.error('No se encontró método para minimizar')
        }
    } catch (error) {
        console.error('Error al minimizar ventana:', error)
    }
}

function toggleMaximize() {
    if (!isElectron.value || !electronAPI.value) {
        console.warn('Función de maximizar no disponible en navegador')
        return
    }

    try {
        if (electronAPI.value.ipcRenderer?.send) {
            electronAPI.value.ipcRenderer.send('window-toggle-maximize')
        } else if (electronAPI.value.maximize) {
            electronAPI.value.maximize()
        } else {
            console.error('No se encontró método para maximizar')
        }
    } catch (error) {
        console.error('Error al maximizar/restaurar ventana:', error)
    }
}

function closeWindow() {
    if (!isElectron.value || !electronAPI.value) {
        console.warn('Función de cerrar no disponible en navegador')
        return
    }

    try {
        if (electronAPI.value.ipcRenderer?.send) {
            electronAPI.value.ipcRenderer.send('window-close')
        } else if (electronAPI.value.close) {
            electronAPI.value.close()
        } else {
            console.error('No se encontró método para cerrar')
        }
    } catch (error) {
        console.error('Error al cerrar ventana:', error)
    }
}

// Exponer el estado de Electron para otros componentes
defineExpose({
    isElectron,
    electronAPI
})
</script>

<style scoped>
.custom-navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    z-index: 9999;
    backdrop-filter: blur(10px);
    background: transparent;
    -webkit-backdrop-filter: blur(10px);
    /* border-bottom: 1px solid rgba(255, 255, 255, 0.08); */
    -webkit-app-region: drag;
    user-select: none;
}

/* Cuando no está en Electron, ocultamos la barra */
.custom-navbar.hidden {
    display: none;
}

.left-section {
    display: flex;
    align-items: center;
    gap: 8px;
}

.app-icon {
    width: 14px;
    height: 18px;
    object-fit: contain;
}

.app-title {
    color: #ffffff;
    font-size: 10px;
    font-weight: 600;
}

.right-section {
    display: flex;
    gap: 6px;
    -webkit-app-region: no-drag;
}

.window-btn {
    background: transparent;
    border: none;
    color: white;
    padding: 4px 10px;
    font-size: 14px;
    border-radius: 4px;
    transition: all 0.2s ease;
    cursor: pointer;
}

.window-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.window-btn:not(:disabled):hover {
    background: rgba(255, 255, 255, 0.2);
}

.window-btn.close:not(:disabled):hover {
    background: #e74c3c;
    color: white;
}

/* Estados activos */
.window-btn:not(:disabled):active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.3);
}

.window-btn.close:not(:disabled):active {
    background: #c0392b;
}

/* Para desarrollo: mostrar un indicador de estado */
.dev-indicator {
    position: absolute;
    top: 2px;
    right: 50%;
    transform: translateX(50%);
    font-size: 8px;
    color: #ffd700;
    opacity: 0.7;
    pointer-events: none;
}
</style>
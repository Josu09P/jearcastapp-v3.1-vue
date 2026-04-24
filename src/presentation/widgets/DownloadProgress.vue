<template>
    <div v-if="show" class="download-progress">
        <div class="progress-container">
            <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="progress-text">{{ progress }}%</span>
        <button @click="cancelDownload" class="cancel-btn" title="Cancelar descarga">
            <i class="bi bi-x-lg"></i>
        </button>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
    downloadId: string
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'cancelled'): void  // NUEVO: Emitir cuando se cancela
}>()

const show = ref(true)
const progress = ref(0)

let isCompleted = false
let isCancelling = false  // NUEVO: Prevenir múltiples clicks en cancelar

const updateProgress = (data: any) => {
    console.log('Progreso recibido:', data)

    if (data.downloadId === props.downloadId) {
        progress.value = data.percent

        // Solo cerrar cuando está completado
        if (data.status === 'completed' && !isCompleted) {
            isCompleted = true
            console.log('Descarga completada')
            setTimeout(() => {
                cleanup()
            }, 1500)
        }

        // Si hay error, cerrar después de 2 segundos
        if (data.status === 'error' && !isCompleted) {
            console.error('Error en descarga')
            setTimeout(() => {
                cleanup()
            }, 2000)
        }

        // Si es cancelado, cerrar inmediatamente
        if (data.status === 'cancelled') {
            console.log('Descarga cancelada')
            cleanup()
        }
    }
}

const cancelDownload = async () => {
    // Prevenir múltiples clicks
    if (isCancelling) {
        console.log('Cancelación ya en progreso')
        return
    }

    isCancelling = true
    console.log('Cancelando descarga:', props.downloadId)

    try {
        // Método 1: Usar la API directa
        if (window.electron?.cancelDownload) {
            console.log('Usando window.electron.cancelDownload')
            const result = await window.electron.cancelDownload(props.downloadId)
            console.log('   Resultado:', result)
        }
        // Método 2: Usar ipcRenderer
        else if (window.electron?.ipcRenderer?.invoke) {
            console.log('Usando ipcRenderer.invoke cancel-download')
            const result = await window.electron.ipcRenderer.invoke('cancel-download', props.downloadId)
            console.log('   Resultado:', result)
        }
        else {
            console.error('No se encontró método para cancelar')
        }
    } catch (error) {
        console.error('Error al cancelar:', error)
    } finally {
        isCancelling = false
        cleanup()
    }
}

const cleanup = () => {
    show.value = false
    emit('close')
}

onMounted(() => {
    console.log('DownloadProgress montado para ID:', props.downloadId)

    // Escuchar progreso de descarga
    if (window.electron?.onDownloadProgress) {
        console.log('   Usando window.electron.onDownloadProgress')
        window.electron.onDownloadProgress(updateProgress)
    } else if (window.electron?.ipcRenderer?.on) {
        console.log('   Usando ipcRenderer.on download-progress')
        window.electron.ipcRenderer.on('download-progress', updateProgress)
    } else {
        console.warn('No se encontró método para escuchar progreso')
    }
})

onUnmounted(() => {
    console.log('DownloadProgress desmontado para ID:', props.downloadId)

    // Limpiar listeners
    if (window.electron?.removeDownloadProgressListener) {
        window.electron.removeDownloadProgressListener()
    } else if (window.electron?.ipcRenderer?.removeAllListeners) {
        window.electron.ipcRenderer.removeAllListeners('download-progress')
    }
})
</script>

<style scoped>
.download-progress {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 10px 15px;
    min-width: 220px;
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: slideIn 0.3s ease;
}

.progress-container {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: #1db954;
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 12px;
    color: white;
    min-width: 35px;
    font-family: monospace;
}

.cancel-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
    font-size: 18px;
}

.cancel-btn:hover {
    color: #ff4d4d;
    background: rgba(255, 77, 77, 0.1);
}

.cancel-btn:active {
    transform: scale(0.9);
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
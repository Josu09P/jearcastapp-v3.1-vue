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
}>()

const show = ref(true)
const progress = ref(0)

let isCompleted = false

const updateProgress = (data: any) => {
    console.log('Progreso recibido:', data)

    if (data.downloadId === props.downloadId) {
        progress.value = data.percent

        // Solo cerrar cuando está completado
        if (data.status === 'completed' && !isCompleted) {
            isCompleted = true
            setTimeout(() => {
                show.value = false
                emit('close')
            }, 1000)
        }

        // Si hay error, cerrar después de 2 segundos
        if (data.status === 'error') {
            setTimeout(() => {
                show.value = false
                emit('close')
            }, 2000)
        }

        // Si es cancelado, cerrar inmediatamente
        if (data.status === 'cancelled') {
            show.value = false
            emit('close')
        }
    }
}

const cancelDownload = async () => {
    if (window.electron?.cancelDownload) {
        await window.electron.cancelDownload(props.downloadId)
        show.value = false
        emit('close')
    } else if (window.electron?.ipcRenderer?.invoke) {
        await window.electron.ipcRenderer.invoke('cancel-download', props.downloadId)
        show.value = false
        emit('close')
    }
}

onMounted(() => {
    console.log('DownloadProgress montado para ID:', props.downloadId)

    if (window.electron?.onDownloadProgress) {
        window.electron.onDownloadProgress(updateProgress)
    } else if (window.electron?.ipcRenderer?.on) {
        window.electron.ipcRenderer.on('download-progress', updateProgress)
    }
})

onUnmounted(() => {
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
    background: var(--accent-color);
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
}

.cancel-btn:hover {
    color: #ff4d4d;
    background: rgba(255, 77, 77, 0.1);
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
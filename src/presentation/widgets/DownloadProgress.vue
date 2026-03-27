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

const updateProgress = (data: any) => {
    if (data.downloadId === props.downloadId) {
        progress.value = data.percent
        if (progress.value >= 100) {
            setTimeout(() => {
                show.value = false
                emit('close')
            }, 1000)
        }
    }
}

const cancelDownload = async () => {
    if (window.electron?.ipcRenderer) {
        await window.electron.ipcRenderer.invoke('cancel-download', props.downloadId)
        show.value = false
        emit('close')
    }
}

onMounted(() => {
    if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.on('download-progress', updateProgress)
    }
})

onUnmounted(() => {
    if (window.electron?.ipcRenderer) {
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
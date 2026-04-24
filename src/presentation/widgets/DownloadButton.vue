<template>
    <div class="download-wrapper">
        <!-- Botón de descarga principal -->
        <div class="dropdown">
            <button class="btn btn-link p-0 download-trigger" type="button" data-bs-toggle="dropdown"
                aria-expanded="false" :disabled="isDownloading"
                :title="isDownloading ? 'Descargando...' : 'Descargar música'">
                <i v-if="!isDownloading" class="bi bi-arrow-down-circle-fill text-secondary"
                    style="font-size: 1.14rem !important;"></i>
                <span v-if="isDownloading" class="spinner-border spinner-border-sm"></span>
            </button>

            <ul class="dropdown-menu dropdown-menu-dark bg-dark border-secondary">
                <!-- Selector de calidad -->
                <li class="dropdown-header">
                    <i class="bi bi-mic me-2"></i>
                    Calidad de audio
                </li>
                <li v-for="quality in qualities" :key="quality.value">
                    <a class="dropdown-item" :class="{ active: selectedQuality === quality.value }" href="#"
                        @click.prevent="setQualityAndDownload(quality.value)">
                        <i :class="quality.icon + ' me-2 ' + quality.color"></i>
                        {{ quality.label }}
                        <span class="quality-badge">{{ quality.size }}</span>
                    </a>
                </li>

                <li>
                    <hr class="dropdown-divider border-secondary">
                </li>

                <!-- Opciones adicionales -->
                <li>
                    <a class="dropdown-item" href="#" @click.prevent="downloadThumbnailOnly">
                        <i class="bi bi-image me-2 text-secondary"></i>
                        Solo portada
                    </a>
                </li>
                <li>
                    <a class="dropdown-item" href="#" @click.prevent="downloadMetadataOnly">
                        <i class="bi bi-file-text me-2 text-light"></i>
                        Solo metadata
                    </a>
                </li>
            </ul>
        </div>

        <DownloadProgress v-if="currentDownloadId" :key="currentDownloadId" :download-id="currentDownloadId"
            @close="handleProgressClose" @cancelled="handleDownloadCancelled" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Toastify from 'toastify-js'
import DownloadProgress from './DownloadProgress.vue'

const props = defineProps<{
    videoId: string
    title: string
    thumbnail?: string
}>()

// Estados
const isDownloading = ref(false)
const currentDownloadId = ref<string | null>(null)
const selectedQuality = ref(320)
const downloadInProgress = ref(false) // NUEVO: Prevenir doble click

// Calidades disponibles
const qualities = [
    { value: 128, label: '128 kbps (Baja)', icon: 'bi-volume-down', color: 'text-secondary', size: '~3MB/min' },
    { value: 192, label: '192 kbps (Media)', icon: 'bi-volume-up', color: 'text-secondary', size: '~4.5MB/min' },
    { value: 256, label: '256 kbps (Alta)', icon: 'bi-volume-up', color: 'text-info', size: '~6MB/min' },
    { value: 320, label: '320 kbps (Mejor)', icon: 'bi-volume-up-fill', color: 'text-success', size: '~7.5MB/min' }
]

// Verificar si estamos en Electron
const isElectron = computed(() => {
    return !!(window.electron && (window.electron.ipcRenderer || window.electron.downloadAudio))
})

// Mostrar toast
const showToast = (text: string, isError: boolean = false) => {
    Toastify({
        text,
        duration: 3000,
        gravity: 'top',
        position: 'right',
        className: isError ? 'toast-glass bg-danger' : 'toast-glass'
    }).showToast()
}

// Manejar cierre del progreso
const handleProgressClose = () => {
    console.log('Cerrando progreso de descarga')
    currentDownloadId.value = null
    isDownloading.value = false
    downloadInProgress.value = false
}

// NUEVO: Manejar cancelación de descarga
const handleDownloadCancelled = () => {
    console.log('Descarga cancelada por el usuario')
    showToast('Descarga cancelada')
    handleProgressClose()
}

// Seleccionar calidad y descargar
const setQualityAndDownload = (quality: number) => {
    // PREVENIR DOBLE CLICK
    if (downloadInProgress.value) {
        showToast('Ya hay una descarga en progreso', true)
        return
    }

    selectedQuality.value = quality
    downloadWithQuality(quality)
}

const downloadWithQuality = async (quality: number) => {
    // Verificar si estamos en Electron
    if (!isElectron.value) {
        showToast('Esta función solo está disponible en la aplicación de escritorio', true)
        return
    }

    // PREVENIR DOBLE INICIO
    if (downloadInProgress.value) {
        console.warn('Ya hay una descarga en progreso')
        return
    }

    downloadInProgress.value = true
    isDownloading.value = true

    // Generar ID único
    const downloadId = `${props.videoId}_${Date.now()}`
    currentDownloadId.value = downloadId

    console.log('Iniciando descarga con ID:', downloadId)

    try {
        showToast(`Descargando en ${quality} kbps...`)

        // Llamar con el downloadId
        const downloadOptions = {
            videoId: props.videoId,
            title: props.title,
            quality: quality,
            downloadId: downloadId  // PASAR EL ID
        }

        console.log('Enviando opciones de descarga:', downloadOptions)

        let result;

        // Intentar múltiples métodos de descarga
        if (window.electron?.downloadAudio) {
            console.log('   Usando window.electron.downloadAudio')
            result = await window.electron.downloadAudio(downloadOptions)
        } else if (window.electron?.ipcRenderer?.invoke) {
            console.log('   Usando ipcRenderer.invoke')
            result = await window.electron.ipcRenderer.invoke('download-audio', downloadOptions)
        } else {
            throw new Error('No se encontró método de descarga disponible')
        }

        console.log('Resultado de descarga:', result)

        if (result.success) {
            showToast(`Descargado: ${props.title} (${quality} kbps)`)
            // Esperar un poco antes de limpiar
            setTimeout(() => {
                if (currentDownloadId.value === downloadId) {
                    handleProgressClose()
                }
            }, 2000)
        } else if (result.cancelled) {
            console.log('Descarga cancelada')
            handleProgressClose()
        } else {
            throw new Error(result.error || 'Error desconocido en la descarga')
        }
    } catch (error: any) {
        console.error('Error en descarga:', error)

        // No mostrar error si fue cancelado
        if (error.message?.includes('cancel') || error.message?.includes('SIGKILL')) {
            console.log('Descarga cancelada (detectado por error)')
        } else {
            showToast(`Error: ${error.message}`, true)
        }

        handleProgressClose()
    }
}

// Descargar solo portada
const downloadThumbnailOnly = async () => {
    if (!props.thumbnail) {
        showToast('No hay portada disponible', true)
        return
    }

    try {
        const link = document.createElement('a')
        link.href = props.thumbnail
        link.download = `${props.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_cover.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        showToast('Portada descargada!')
    } catch (error) {
        showToast('Error al descargar portada', true)
    }
}

// Descargar solo metadata
const downloadMetadataOnly = async () => {
    const metadata = {
        title: props.title,
        videoId: props.videoId,
        thumbnail: props.thumbnail,
        downloadedAt: new Date().toISOString(),
        source: `https://youtube.com/watch?v=${props.videoId}`
    }

    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${props.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_metadata.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showToast('Metadata descargada!')
}

// Limpiar al desmontar
onUnmounted(() => {
    // Si hay una descarga en progreso, no limpiar el ID
    // para que DownloadProgress pueda seguir mostrando el progreso
    console.log('🧹 Componente desmontado, descarga en progreso:', downloadInProgress.value)
})
</script>

<style scoped>
.download-wrapper {
    display: inline-flex;
    align-items: center;
    position: relative;
}

.download-trigger {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    padding: 6px 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.download-trigger:hover:not(:disabled) {
    color: #1db954;
    background: rgba(29, 185, 84, 0.1);
    transform: scale(1.1);
}

.download-trigger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.dropdown-menu {
    min-width: 260px;
    margin-top: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(10px);
}

.dropdown-header {
    padding: 8px 16px;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.dropdown-item {
    font-size: 0.85rem;
    padding: 8px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.dropdown-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.dropdown-item.active {
    background-color: rgba(29, 185, 84, 0.2);
    color: #1db954;
}

.quality-badge {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.4);
}

.dropdown-divider {
    margin: 4px 0;
}

/* Animación de spinner */
@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>
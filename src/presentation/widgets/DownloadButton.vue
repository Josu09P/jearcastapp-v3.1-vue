<template>
    <div class="download-wrapper">
        <!-- Botón de descarga principal -->
        <div class="dropdown">
            <button class="btn btn-link p-0 download-trigger" type="button" data-bs-toggle="dropdown"
                aria-expanded="false" :disabled="downloading"
                :title="downloading ? 'Descargando...' : 'Descargar música'">
                <i v-if="!downloading" class="bi bi-arrow-down-circle-fill text-secondary"
                    style="font-size: 1.14rem !important;"></i>
                <span v-if="downloading" class="spinner-border spinner-border-sm"></span>
            </button>

            <ul class="dropdown-menu dropdown-menu-dark bg-dark border-secondary">
                <!-- Selector de calidad -->
                <li class="dropdown-header">
                    <i class="bi bi-mic me-2"></i>
                    Calidad de audio
                </li>
                <li>
                    <a class="dropdown-item" href="#" @click.prevent="setQualityAndDownload(128)">
                        <i class="bi bi-volume-down me-2 text-secondary"></i>
                        128 kbps (Baja)
                        <span class="quality-badge">~3MB/min</span>
                    </a>
                </li>
                <li>
                    <a class="dropdown-item" href="#" @click.prevent="setQualityAndDownload(192)">
                        <i class="bi bi-volume-up me-2 text-secondary"></i>
                        192 kbps (Media)
                        <span class="quality-badge">~4.5MB/min</span>
                    </a>
                </li>
                <li>
                    <a class="dropdown-item" href="#" @click.prevent="setQualityAndDownload(256)">
                        <i class="bi bi-volume-up me-2 text-info"></i>
                        256 kbps (Alta)
                        <span class="quality-badge">~6MB/min</span>
                    </a>
                </li>
                <li>
                    <a class="dropdown-item active" href="#" @click.prevent="setQualityAndDownload(320)">
                        <i class="bi bi-volume-up-fill me-2 text-success"></i>
                        320 kbps (Mejor)
                        <span class="quality-badge">~7.5MB/min</span>
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

        <DownloadProgress v-if="currentDownloadId" :download-id="currentDownloadId"
            @close="() => currentDownloadId = null" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Toastify from 'toastify-js'
import DownloadProgress from './DownloadProgress.vue'

const props = defineProps<{
    videoId: string
    title: string
    thumbnail?: string
}>()

const downloading = ref(false)
const currentDownloadId = ref<string | null>(null)
const selectedQuality = ref(320)

// Verificar si estamos en Electron
const isElectron = () => {
    return !!(window.electron && window.electron.ipcRenderer)
}

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
    currentDownloadId.value = null
    downloading.value = false
}

const downloadWithQuality = async (quality: number) => {
    if (!isElectron()) {
        showToast('Esta función solo está disponible en la aplicación de escritorio', true)
        return
    }

    downloading.value = true

    // Generar ID único
    const downloadId = `${props.videoId}_${Date.now()}`
    currentDownloadId.value = downloadId

    try {
        showToast(`Descargando en ${quality} kbps...`)

        // Llamar con el downloadId
        const result = await window.electron!.ipcRenderer.invoke('download-audio', {
            videoId: props.videoId,
            title: props.title,
            quality: quality,
            downloadId: downloadId  // ← PASAR EL ID
        })

        if (result.success) {
            showToast(`Descargado: ${result.info?.title || props.title} (${quality} kbps)`)
            setTimeout(() => {
                if (currentDownloadId.value === downloadId) {
                    currentDownloadId.value = null
                }
                downloading.value = false
            }, 1500)
        } else {
            throw new Error(result.error)
        }
    } catch (error: any) {
        console.error('Error:', error)
        showToast(`Error: ${error.message}`, true)
        currentDownloadId.value = null
        downloading.value = false
    }
}

// Seleccionar calidad y descargar
const setQualityAndDownload = (quality: number) => {
    selectedQuality.value = quality
    downloadWithQuality(quality)
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
</style>
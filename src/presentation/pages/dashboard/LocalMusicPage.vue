<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'
import { useLocalMusicStore } from '@/stores/local-music-store'
import { usePlayerStore } from '@/stores/player-store'
import Toastify from 'toastify-js'
import Swal from 'sweetalert2'

const localMusicStore = useLocalMusicStore()
const playerStore = usePlayerStore()
const loading = ref(false)

const showToast = (text: string, isError: boolean = false) => {
    Toastify({
        text,
        duration: 3000,
        gravity: 'top',
        position: 'right',
        className: isError ? 'toast-glass bg-danger' : 'toast-glass'
    }).showToast()
}

const selectFolder = async () => {
    const success = await localMusicStore.selectFolder()
    if (success) {
        showToast(`✅ Carpeta seleccionada: ${localMusicStore.musicFolder}`)
    } else {
        showToast('❌ Error al seleccionar la carpeta', true)
    }
}

const rescan = async () => {
    await localMusicStore.rescan()
    showToast(`Escaneo completado: ${localMusicStore.totalTracks} canciones encontradas`)
}

const clearFolder = async () => {
    const result = await Swal.fire({
        title: '¿Eliminar configuración?',
        text: 'Se eliminará la carpeta seleccionada de la configuración',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        customClass: {
            popup: 'glass-modal',
            title: 'text-white',
            htmlContainer: 'text-white',
            confirmButton: 'btn btn-danger me-2',
            cancelButton: 'btn btn-secondary'
        },
        buttonsStyling: false
    })

    if (result.isConfirmed) {
        localMusicStore.clearFolder()
        showToast('Configuración eliminada')
    }
}

// ==================== FUNCIÓN PRINCIPAL PARA REPRODUCIR ====================
const playTrack = (index: number) => {
    const track = localMusicStore.tracks[index]
    if (!track) return

    // Crear playlist con formato que el reproductor espera
    const playlist = localMusicStore.tracks.map(t => ({
        video_id: t.id,
        video_title: t.title,
        video_thumbnail: t.cover || '',
        video_author: t.artist || 'Artista desconocido',
        isLocal: true,           // <-- Importante: identificar como música local
        localPath: t.path        // <-- Importante: ruta del archivo local
    }))

    // Enviar al reproductor global
    playerStore.setPlaylist(playlist, index)
    showToast(`🎵 Reproduciendo: ${track.title}`)
}
// ==================== FIN ====================
</script>

<template>
    <DashboardLayout>
        <div class="container-fluid px-4 py-4">
            <div class="d-flex justify-content-between align-items-center mb-4" style="margin-top: -22px !important;">
                <h4 class="text-white mb-0 fw-bold" style="margin-top: 0px !important;">Música Local</h4>
            </div>

            <!-- Configuración de carpeta -->
            <div v-if="!localMusicStore.musicFolder" class="setup-card">
                <i class="bi bi-folder-music"></i>
                <h5>Configurar música local</h5>
                <p>Selecciona la carpeta donde tienes tu música descargada</p>
                <button @click="selectFolder" :disabled="localMusicStore.loading" class="btn-select-folder">
                    <i class="bi bi-folder2-open"></i>
                    Seleccionar carpeta
                </button>
            </div>

            <div v-else class="music-content">
                <!-- Info de la carpeta -->
                <div class="folder-info">
                    <div class="folder-bar">
                        <i class="bi bi-folder"></i>
                        <span class="folder-path">{{ localMusicStore.musicFolder }}</span>
                        <button @click="selectFolder" class="action-icon" title="Cambiar carpeta">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button @click="rescan" :disabled="localMusicStore.loading" class="action-icon"
                            title="Reescanear">
                            <i :class="localMusicStore.loading ? 'bi-arrow-repeat spin' : 'bi-arrow-repeat'"></i>
                        </button>
                        <button @click="clearFolder" class="action-icon text-danger" title="Limpiar configuración">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </div>

                    <div class="stats">
                        <span><i class="bi bi-music-note-beamed"></i> {{ localMusicStore.totalTracks }} canciones</span>
                        <span><i class="bi bi-database"></i> {{ localMusicStore.formattedTotalSize }}</span>
                        <span v-if="localMusicStore.lastScan"><i class="bi bi-clock-history"></i> {{
                            localMusicStore.lastScan.toLocaleDateString() }}</span>
                    </div>
                </div>

                <!-- Lista de canciones -->
                <div v-if="localMusicStore.tracks.length > 0" class="tracks-list">
                    <div class="list-header">
                        <div class="col-index">#</div>
                        <div class="col-title">Título</div>
                        <div class="col-artist">Artista</div>
                        <div class="col-duration">Duración</div>
                        <div class="col-actions"></div>
                    </div>

                    <div v-for="(track, index) in localMusicStore.tracks" :key="track.id" class="track-item"
                        @dblclick="playTrack(index)">
                        <div class="col-index">
                            <span class="number">{{ index + 1 }}</span>
                            <i class="bi bi-play-fill play-icon" @click.stop="playTrack(index)"></i>
                        </div>
                        <div class="col-title">
                            <i class="bi bi-file-music"></i>
                            <span>{{ track.title }}</span>
                        </div>
                        <div class="col-artist">{{ track.artist || '—' }}</div>
                        <div class="col-duration">{{ track.duration ? `${Math.floor(track.duration /
                            60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '—' }}</div>
                        <div class="col-actions">
                            <button @click.stop="playTrack(index)" class="action-btn" title="Reproducir">
                                <i class="bi bi-play-circle"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div v-else class="empty-tracks">
                    <i class="bi bi-music-note-beamed"></i>
                    <p>No se encontraron archivos de audio en esta carpeta</p>
                    <small>Formatos soportados: MP3, FLAC, WAV, OGG, M4A, AAC</small>
                </div>
            </div>
        </div>
    </DashboardLayout>
</template>

<style scoped>
.setup-card {
    text-align: center;
    padding: 3rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px dashed rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    max-width: 500px;
    margin: 2rem auto;
}

.setup-card i {
    font-size: 4rem;
    color: rgba(255, 255, 255, 0.3);
    margin-bottom: 1rem;
}

.setup-card h5 {
    color: white;
    margin-bottom: 0.5rem;
}

.setup-card p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
}

.btn-select-folder {
    padding: 0.6rem 1.5rem;
    background: rgba(var(--accent-color-rgb), 0.1) !important;
    border: 1px solid var(--accent-color);
    border-radius: 30px;
    color: var(--accent-color);
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-select-folder:hover {
    background: var(--accent-color) !important;
    color: white !important;
    transform: translateY(-2px);
}

.folder-info {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1.5rem;
}

.folder-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
}

.folder-bar i {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.5);
}

.folder-path {
    flex: 1;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.action-icon {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.action-icon:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.stats {
    display: flex;
    gap: 1rem;
    margin-top: 0.75rem;
    padding: 0 0.5rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
}

.stats i {
    margin-right: 0.25rem;
}

/* Lista de canciones */
.tracks-list {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    overflow: hidden;
}

.list-header {
    display: grid;
    grid-template-columns: 50px 1fr 1fr 100px 60px;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.4);
}

.track-item {
    display: grid;
    grid-template-columns: 50px 1fr 1fr 100px 60px;
    padding: 0.75rem 1rem;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    cursor: pointer;
    transition: background 0.2s ease;
}

.track-item:hover {
    background: rgba(255, 255, 255, 0.03);
}

.col-index {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.col-index .number {
    display: inline-block;
}

.col-index .play-icon {
    display: none;
    font-size: 1rem;
    cursor: pointer;
}

.track-item:hover .col-index .number {
    display: none;
}

.track-item:hover .col-index .play-icon {
    display: inline-block;
}

.col-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.col-title i {
    color: rgba(255, 255, 255, 0.4);
    font-size: 1rem;
}

.col-title span {
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.col-artist {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.col-duration {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.8rem;
}

.col-actions {
    display: flex;
    gap: 0.5rem;
}

.action-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-btn:hover {
    color: white;
    transform: scale(1.1);
}

.empty-tracks {
    text-align: center;
    padding: 3rem;
    color: rgba(255, 255, 255, 0.4);
}

.empty-tracks i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.3;
}

.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@media (max-width: 768px) {

    .list-header,
    .track-item {
        grid-template-columns: 40px 1fr 60px;
    }

    .col-artist,
    .col-duration {
        display: none;
    }
}
</style>
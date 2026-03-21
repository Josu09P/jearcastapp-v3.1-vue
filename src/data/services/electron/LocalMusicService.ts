import type { LocalTrack, MusicFolderInfo } from '@/domain/models/LocalMusicModel'

// Seleccionar carpeta de música
export const selectMusicFolder = async (): Promise<MusicFolderInfo | null> => {
  try {
    const result = await window.electron?.ipcRenderer.invoke('select-music-folder')
    if (result && result.folderPath) {
      return {
        path: result.folderPath,
        tracks: result.musicFiles,
        lastScan: new Date(),
        totalSize: result.musicFiles.reduce(
          (acc: number, track: LocalTrack) => acc + track.size,
          0,
        ),
        totalTracks: result.musicFiles.length,
      }
    }
    return null
  } catch (error) {
    console.error('Error seleccionando carpeta:', error)
    return null
  }
}

// Escanear carpeta existente
export const scanMusicFolder = async (folderPath: string): Promise<LocalTrack[]> => {
  try {
    const result = await window.electron?.ipcRenderer.invoke('scan-music-folder', folderPath)
    return result || []
  } catch (error) {
    console.error('Error escaneando carpeta:', error)
    return []
  }
}

// Obtener metadatos de un archivo de audio
export const getAudioMetadata = async (filePath: string): Promise<Partial<LocalTrack>> => {
  try {
    const metadata = await window.electron?.ipcRenderer.invoke('get-audio-metadata', filePath)
    return metadata || {}
  } catch (error) {
    console.error('Error obteniendo metadatos:', error)
    return {}
  }
}

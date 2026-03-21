import Toastify from 'toastify-js'

interface DownloadOptions {
  videoId: string
  title: string
  thumbnail?: string
}

interface DownloadFormat {
  quality: string
  container: string
  size?: string
}

class DownloadService {
  private API_BASE = 'https://your-backend-api.com/api/download' // Cambia esto por tu API

  /**
   * Obtiene la mejor calidad disponible desde YouTube
   */
  private async getBestAudioFormat(videoId: string): Promise<DownloadFormat | null> {
    try {
      // Opción 1: Usar tu backend
      const response = await fetch(`${this.API_BASE}/info/${videoId}`)
      const data = await response.json()

      return {
        quality: '320kbps',
        container: 'mp3',
        size: data.size,
      }
    } catch (error) {
      console.error('Error obteniendo formato:', error)
      return null
    }
  }

  /**
   * Descarga el audio en MP3 con la mejor calidad
   */
  async downloadAsMP3({ videoId, title, thumbnail }: DownloadOptions): Promise<void> {
    try {
      Toastify({
        text: '🔄 Preparando descarga MP3...',
        duration: 3000,
        className: 'toast-glass',
        gravity: 'top',
        position: 'right',
      }).showToast()

      // Opción 1: A través de tu backend
      const downloadUrl = `${this.API_BASE}/mp3/${videoId}`

      // Crear un enlace temporal para descargar
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${this.sanitizeFilename(title)}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      Toastify({
        text: '✅ Descarga completada!',
        duration: 3000,
        className: 'toast-glass',
        gravity: 'top',
        position: 'right',
      }).showToast()

      // Opcional: Guardar metadatos para ID3 tags
      await this.saveMetadata(videoId, title, thumbnail)
    } catch (error) {
      console.error('Error en descarga MP3:', error)
      Toastify({
        text: '❌ Error al descargar MP3',
        duration: 3000,
        className: 'toast-glass bg-danger',
        gravity: 'top',
        position: 'right',
      }).showToast()
    }
  }

  /**
   * Descarga en otros formatos (M4A, WEBM, OPUS)
   */
  async downloadAsFormat(
    { videoId, title, thumbnail }: DownloadOptions,
    format: 'm4a' | 'webm' | 'opus',
  ): Promise<void> {
    try {
      Toastify({
        text: `🔄 Preparando descarga ${format.toUpperCase()}...`,
        duration: 3000,
        className: 'toast-glass',
        gravity: 'top',
        position: 'right',
      }).showToast()

      const downloadUrl = `${this.API_BASE}/${format}/${videoId}`

      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${this.sanitizeFilename(title)}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      Toastify({
        text: `✅ Descarga ${format.toUpperCase()} completada!`,
        duration: 3000,
        className: 'toast-glass',
        gravity: 'top',
        position: 'right',
      }).showToast()
    } catch (error) {
      console.error(`Error en descarga ${format}:`, error)
      Toastify({
        text: `❌ Error al descargar ${format}`,
        duration: 3000,
        className: 'toast-glass bg-danger',
        gravity: 'top',
        position: 'right',
      }).showToast()
    }
  }

  /**
   * Descarga con todas las calidades disponibles
   */
  async downloadAllQualities({ videoId, title, thumbnail }: DownloadOptions): Promise<void> {
    const qualities = ['128kbps', '192kbps', '320kbps']

    for (const quality of qualities) {
      try {
        Toastify({
          text: `🔄 Descargando ${quality}...`,
          duration: 2000,
          className: 'toast-glass',
          gravity: 'top',
          position: 'right',
        }).showToast()

        const downloadUrl = `${this.API_BASE}/mp3/${videoId}?quality=${quality}`

        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `${this.sanitizeFilename(title)}_${quality}.mp3`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Pequeña pausa entre descargas
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Error descargando ${quality}:`, error)
      }
    }

    Toastify({
      text: '✅ Todas las calidades descargadas!',
      duration: 3000,
      className: 'toast-glass',
      gravity: 'top',
      position: 'right',
    }).showToast()
  }

  /**
   * Guarda la metadata en un archivo .txt junto con la descarga
   */
  async saveMetadata(videoId: string, title: string, thumbnail?: string): Promise<void> {
    const metadata = {
      title: title,
      artist: 'YouTube Music',
      album: 'Descargas JearCast',
      year: new Date().getFullYear(),
      thumbnail: thumbnail,
      source: `https://youtube.com/watch?v=${videoId}`,
      downloaded: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${this.sanitizeFilename(title)}_metadata.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  /**
   * Limpia el nombre del archivo para evitar caracteres inválidos
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase()
  }

  /**
   * Descarga la imagen del thumbnail para usarla como portada
   */
  async downloadThumbnail(thumbnailUrl: string, title: string): Promise<void> {
    try {
      const response = await fetch(thumbnailUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `${this.sanitizeFilename(title)}_cover.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      Toastify({
        text: '✅ Portada descargada!',
        duration: 2000,
        className: 'toast-glass',
        gravity: 'top',
        position: 'right',
      }).showToast()
    } catch (error) {
      console.error('Error descargando thumbnail:', error)
    }
  }
}

export const downloadService = new DownloadService()

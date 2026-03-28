// src/jearcast-view/src/vite-env.d.ts
/// <reference types="vite/client" />

declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void

    // API completa de Electron
    electron?: {
      // Métodos directos
      getVideoInfo: (videoId: string) => Promise<any>
      downloadAudio: (options: {
        videoId: string
        title: string
        quality: number
        downloadId?: string
      }) => Promise<any>
      cancelDownload: (downloadId: string) => Promise<boolean>
      getDownloadedFiles: () => Promise<any>
      onDownloadProgress: (callback: (data: any) => void) => void
      removeDownloadProgressListener: () => void

      // Controles de ventana
      minimize: () => void
      maximize: () => void
      close: () => void

      // Teclas multimedia
      onMediaKey: (callback: (key: string) => void) => void
      removeMediaKeyListener: () => void

      // ipcRenderer (para casos generales)
      ipcRenderer: {
        send: (channel: string, data?: any) => void
        on: (channel: string, func: (...args: any[]) => void) => void
        invoke: (channel: string, data?: any) => Promise<any>
        removeAllListeners: (channel: string) => void
        once: (channel: string, callback: (...args: any[]) => void) => void
        removeListener: (channel: string, callback: (...args: any[]) => void) => void
      }
      send?: (channel: string, data?: any) => void
    }

    electronAudio?: {
      setEqualizer: (settings: any) => void
      setVolume: (volume: number) => void
      play: (options: any) => Promise<any>
      stop: () => Promise<any>
      onEnded: (callback: () => void) => void
      onEqChanged: (callback: (settings: any) => void) => void
      removeListeners: () => void
    }

    electronAPI?: {
      openExternal: (url: string) => void
      selectMusicDirectory: () => Promise<any>
      selectMusicFolder: () => Promise<any>
      scanMusicFolder: (folderPath: string) => Promise<any>
      getAudioMetadata: (filePath: string) => Promise<any>
    }
  }
}

export {}

import { defineStore } from 'pinia'
import type { LocalTrack, MusicFolderInfo } from '@/domain/models/LocalMusicModel'
import { selectMusicFolderUseCase } from '@/domain/usecases/localMusic/SelectMusicFolderUseCase'
import { scanMusicFolderUseCase } from '@/domain/usecases/localMusic/ScanMusicFolderUseCase'

const STORAGE_KEY = 'local_music_folder'

export const useLocalMusicStore = defineStore('localMusic', {
  state: () => ({
    musicFolder: localStorage.getItem(STORAGE_KEY) || '',
    tracks: [] as LocalTrack[],
    loading: false,
    lastScan: null as Date | null,
    totalSize: 0,
  }),

  actions: {
    async selectFolder() {
      this.loading = true
      try {
        const result = await selectMusicFolderUseCase()
        if (result) {
          this.musicFolder = result.path
          this.tracks = result.tracks
          this.lastScan = result.lastScan
          this.totalSize = result.totalSize
          localStorage.setItem(STORAGE_KEY, result.path)
          return true
        }
        return false
      } catch (error) {
        console.error('Error seleccionando carpeta:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    async rescan() {
      if (!this.musicFolder) return
      this.loading = true
      try {
        const tracks = await scanMusicFolderUseCase(this.musicFolder)
        this.tracks = tracks
        this.lastScan = new Date()
        this.totalSize = tracks.reduce((acc, t) => acc + t.size, 0)
      } catch (error) {
        console.error('Error escaneando:', error)
      } finally {
        this.loading = false
      }
    },

    clearFolder() {
      this.musicFolder = ''
      this.tracks = []
      this.lastScan = null
      this.totalSize = 0
      localStorage.removeItem(STORAGE_KEY)
    },

    formatSize(bytes: number): string {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
  },

  getters: {
    totalTracks: (state) => state.tracks.length,
    formattedTotalSize: (state) => {
      if (state.totalSize === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(state.totalSize) / Math.log(k))
      return parseFloat((state.totalSize / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
  },
})

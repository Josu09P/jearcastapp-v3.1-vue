import { defineStore } from 'pinia'

export type Track = {
  video_id: string
  video_title: string
  video_thumbnail: string
  video_author?: string
  video_likes?: string | number
  isLocal?: boolean
  localPath?: string
}

export type PlaybackContext = {
  type: 'favorites' | 'playlist' | 'recommended'
  id?: string
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    playlist: [] as Track[],
    currentIndex: 0,
    isPlaying: false,
    isShuffling: false,
    isFullScreen: false,
    shuffleHistory: [] as number[], // Historial de índices reproducidos
    shuffleQueue: [] as number[], // Cola de reproducción aleatoria
    playbackContext: null as PlaybackContext | null,
    hasMoreInContext: false,
  }),

  getters: {
    currentTrack(state): Track | null {
      return state.playlist[state.currentIndex] || null
    },
  },

  actions: {
    setPlaylist(tracks: Track[], startIndex = 0, context: PlaybackContext | null = null, hasMore = false) {
      this.playlist = tracks
      this.currentIndex = startIndex
      this.playbackContext = context
      this.hasMoreInContext = hasMore
      this.isPlaying = true
      this.isFullScreen = true
      this.resetShuffleQueue()
    },

    setHasMore(hasMore: boolean) {
      this.hasMoreInContext = hasMore
    },

    resetShuffleQueue() {
      // Crear una cola aleatoria con todos los índices
      const indices = Array.from({ length: this.playlist.length }, (_, i) => i)
      // Evitar que la canción actual sea la primera si es posible (opcional)
      this.shuffleQueue = this.shuffleArray(indices.filter(i => i !== this.currentIndex))
      this.shuffleHistory = []
    },

    shuffleArray(array: number[]): number[] {
      const shuffled = [...array]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    },

    updateCurrentTrackAuthor(author: string) {
      if (this.playlist[this.currentIndex]) {
        this.playlist[this.currentIndex].video_author = author
      }
    },

    addToPlaylist(tracks: Track[]) {
      const oldLength = this.playlist.length
      this.playlist = [...this.playlist, ...tracks]
      // Si hay nuevas canciones y estamos en modo aleatorio, actualizar cola
      if (this.isShuffling && tracks.length > 0) {
        const newIndices = Array.from({ length: tracks.length }, (_, i) => oldLength + i)
        // Mezclar las nuevas y añadirlas al final de la cola actual
        this.shuffleQueue.push(...this.shuffleArray(newIndices))
      }
    },

    openFullScreen() {
      this.isFullScreen = true
    },

    closeFullScreen() {
      this.isFullScreen = false
    },

    playIndex(index: number) {
      if (index >= 0 && index < this.playlist.length) {
        this.currentIndex = index
        this.isPlaying = true
      }
    },

    toggleShuffle() {
      this.isShuffling = !this.isShuffling
      if (this.isShuffling) {
        this.resetShuffleQueue()
      }
    },

    play() {
      this.isPlaying = true
    },

    pause() {
      this.isPlaying = false
    },

    next() {
      if (this.isShuffling) {
        return this.nextShuffled()
      }
      return this.nextNormal()
    },

    nextShuffled() {
      if (this.playlist.length === 0) return

      // Si no hay cola o está vacía, regenerar
      if (this.shuffleQueue.length === 0) {
        this.resetShuffleQueue()
      }

      // Si después de regenerar sigue vacía, salir
      if (this.shuffleQueue.length === 0) return

      // Obtener siguiente índice
      const nextIndex = this.shuffleQueue.shift()!

      // Registrar el índice actual en historial
      this.shuffleHistory.push(this.currentIndex)

      // Si el historial es muy grande, limpiar (mantener último 50)
      if (this.shuffleHistory.length > 50) {
        this.shuffleHistory.shift()
      }

      this.currentIndex = nextIndex
      this.isPlaying = true
    },

    nextNormal() {
      if (this.currentIndex < this.playlist.length - 1) {
        this.currentIndex++
        this.isPlaying = true
      } else {
        console.log('Llegaste al final de la playlist')
        this.isPlaying = false
      }
    },

    prev() {
      if (this.isShuffling) {
        return this.prevShuffled()
      }
      return this.prevNormal()
    },

    prevShuffled() {
      if (this.shuffleHistory.length === 0) {
        // Si no hay historial, no se puede retroceder
        console.log('No hay historial para retroceder')
        return
      }

      // Obtener el índice anterior del historial
      const prevIndex = this.shuffleHistory.pop()!

      // Guardar el índice actual para poder avanzar de nuevo
      this.shuffleQueue.unshift(this.currentIndex)

      this.currentIndex = prevIndex
      this.isPlaying = true
    },

    prevNormal() {
      if (this.currentIndex > 0) {
        this.currentIndex--
        this.isPlaying = true
      }
    },
  },
})

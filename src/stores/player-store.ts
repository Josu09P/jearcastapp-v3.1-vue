import { defineStore } from 'pinia'

export type Track = {
  video_id: string
  video_title: string
  video_thumbnail: string
  video_author?: string
  video_likes?: string | number
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    playlist: [] as Track[],
    currentIndex: 0,
    isPlaying: false,
    isShuffling: false,
    // FULLSCREEN -> NEW
    isFullScreen: false,
  }),
  getters: {
    currentTrack(state): Track | null {
      return state.playlist[state.currentIndex] || null
    },
  },
  actions: {
    setPlaylist(tracks: Track[], startIndex = 0) {
      this.playlist = tracks
      this.currentIndex = startIndex
      this.isPlaying = true
      // Resetear shuffle y fullscreen al cambiar la playlist
      this.isFullScreen = true
    },
    // NUEVA ACCIÓN: Actualizar autor de la canción actual
    updateCurrentTrackAuthor(author: string) {
      if (this.playlist[this.currentIndex]) {
        this.playlist[this.currentIndex].video_author = author
      }
    },

    // OPEN/CLOSE FULLSCREEN
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
    },

    play() {
      this.isPlaying = true
    },

    pause() {
      this.isPlaying = false
    },

    next() {
      if (this.isShuffling) {
        // 🔥 Modo aleatorio
        const max = this.playlist.length
        let newIndex = this.currentIndex

        // Evitar repetir la misma canción
        while (newIndex === this.currentIndex && max > 1) {
          newIndex = Math.floor(Math.random() * max)
        }

        this.currentIndex = newIndex
        this.isPlaying = true
        return
      }

      // Siguiente normal
      if (this.currentIndex < this.playlist.length - 1) {
        this.currentIndex++
        this.isPlaying = true
      }
    },

    prev() {
      if (this.currentIndex > 0) {
        this.currentIndex--
        this.isPlaying = true
      }
    },
  },
})

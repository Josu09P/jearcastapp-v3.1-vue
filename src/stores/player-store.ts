import { defineStore } from 'pinia'

export type Track = {
  video_id: string
  video_title: string
  video_thumbnail: string
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    playlist: [] as Track[],
    currentIndex: 0,
    isPlaying: false,
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
    },
    playIndex(index: number) {
      if (index >= 0 && index < this.playlist.length) {
        this.currentIndex = index
        this.isPlaying = true
      }
    },
    play() {
      this.isPlaying = true
    },
    pause() {
      this.isPlaying = false
    },
    next() {
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

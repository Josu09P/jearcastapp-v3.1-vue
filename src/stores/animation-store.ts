import { defineStore } from 'pinia'
import animationData1 from '@/assets/anim/animation-sound2.json'
import animationData9 from '@/assets/anim/animation-sound.json'
import animationData2 from '@/assets/anim/animation-sound3.json'
import animationData3 from '@/assets/anim/animation-sound4.json'
import animationData4 from '@/assets/anim/animation-sound5.json'
import animationData5 from '@/assets/anim/animation-sound6.json'
import animationData6 from '@/assets/anim/animation-sound7.json'
import animationData7 from '@/assets/anim/animation-sound8.json'

export interface AnimationOption {
  id: string
  name: string
  data: any
  preview: string // emoji para vista previa
}

export const animations: AnimationOption[] = [
  { id: 'default', name: 'Red and blue waves', data: animationData1, preview: '' },
  { id: 'demo', name: 'Circular waves', data: animationData9, preview: '' },
  { id: 'bars', name: 'Violet Music Girl', data: animationData2, preview: '' },
  { id: 'circles', name: 'Yellow Music Girl', data: animationData3, preview: '' },
  { id: 'waves', name: 'Circle of music', data: animationData4, preview: '' },
  { id: 'particles', name: 'Circle of Waves', data: animationData5, preview: '' },
  { id: 'stars', name: 'Blue Waves', data: animationData6, preview: '' },
  { id: 'fireworks', name: 'Dinosaur Music', data: animationData7, preview: '' },
]

export const useAnimationStore = defineStore('animation', {
  state: () => ({
    currentAnimationId: localStorage.getItem('selectedAnimation') || 'default',
  }),
  actions: {
    setAnimation(id: string) {
      if (animations.some((a) => a.id === id)) {
        this.currentAnimationId = id
        localStorage.setItem('selectedAnimation', id)
      }
    },
    resetToDefault() {
      this.currentAnimationId = 'default'
      localStorage.setItem('selectedAnimation', 'default')
    },
    getCurrentAnimation() {
      return animations.find((a) => a.id === this.currentAnimationId) || animations[0]
    },
  },
  getters: {
    currentAnimation: (state) => {
      return animations.find((a) => a.id === state.currentAnimationId) || animations[0]
    },
  },
})

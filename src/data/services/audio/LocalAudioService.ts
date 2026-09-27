let localAudio: HTMLAudioElement | null = null
let audioContext: AudioContext | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let bassFilter: BiquadFilterNode | null = null
let midFilter: BiquadFilterNode | null = null
let trebleFilter: BiquadFilterNode | null = null
let compressorNode: DynamicsCompressorNode | null = null
let masterGainNode: GainNode | null = null

export const setLocalAudioEq = (eq: { bass?: number; mid?: number; treble?: number }) => {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {})
  }
  if (bassFilter && typeof eq.bass === 'number') {
    bassFilter.gain.value = eq.bass
  }
  if (midFilter && typeof eq.mid === 'number') {
    midFilter.gain.value = eq.mid
  }
  if (trebleFilter && typeof eq.treble === 'number') {
    trebleFilter.gain.value = eq.treble
  }
}

const initWebAudioEq = (audio: HTMLAudioElement) => {
  if (audioContext) return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    audioContext = new AudioCtx()

    // 1. Bass: Lowshelf a 100Hz
    bassFilter = audioContext.createBiquadFilter()
    bassFilter.type = 'lowshelf'
    bassFilter.frequency.value = 100

    // 2. Mid: Peaking a 1000Hz (Q = 1)
    midFilter = audioContext.createBiquadFilter()
    midFilter.type = 'peaking'
    midFilter.frequency.value = 1000
    midFilter.Q.value = 1

    // 3. Treble: Highshelf a 3200Hz
    trebleFilter = audioContext.createBiquadFilter()
    trebleFilter.type = 'highshelf'
    trebleFilter.frequency.value = 3200

    // 4. Dynamics Compressor (Ecualización y control dinámico tipo mastering para pegada sin distorsión)
    compressorNode = audioContext.createDynamicsCompressor()
    compressorNode.threshold.value = -14 // dB
    compressorNode.knee.value = 20
    compressorNode.ratio.value = 4
    compressorNode.attack.value = 0.005 // 5ms
    compressorNode.release.value = 0.25 // 250ms

    // 5. Ganancia limpia de salida (+2.6 dB boost) para mayor presencia y volumen acústico
    masterGainNode = audioContext.createGain()
    masterGainNode.gain.value = 1.35

    sourceNode = audioContext.createMediaElementSource(audio)
    sourceNode.connect(bassFilter)
    bassFilter.connect(midFilter)
    midFilter.connect(trebleFilter)
    trebleFilter.connect(compressorNode)
    compressorNode.connect(masterGainNode)
    masterGainNode.connect(audioContext.destination)

    const savedEq = localStorage.getItem('audio-eq')
    if (savedEq) {
      try {
        const parsed = JSON.parse(savedEq)
        setLocalAudioEq(parsed)
      } catch (_) {}
    }
  } catch (e) {
    console.warn('WebAudio EQ no pudo inicializarse:', e)
  }
}

const getAudioInstance = (): HTMLAudioElement => {
  if (!localAudio) {
    localAudio = new Audio()
    const savedVol = localStorage.getItem('audio-volume')
    if (savedVol) {
      localAudio.volume = Math.max(0, Math.min(1, parseInt(savedVol, 10) / 100))
    } else {
      localAudio.volume = 1.0
    }
  }
  return localAudio
}

export const initLocalAudio = (): HTMLAudioElement => {
  return getAudioInstance()
}

export const playStream = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const audio = getAudioInstance()
    initWebAudioEq(audio)
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {})
    }
    
    // Forzar limpieza previa para evitar conflictos de buffer
    audio.pause()
    audio.src = ''
    audio.load()
    
    audio.src = url
    audio.load()

    let settled = false

    const cleanup = () => {
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('error', onError)
      if (timeoutId) clearTimeout(timeoutId)
    }

    const onPlaying = () => {
      if (settled) return
      settled = true
      cleanup()
      console.log('🔊 [AudioService] Reproducción iniciada')
      resolve()
    }

    const onCanPlay = () => {
      audio.play().then(() => {
        if (!settled) {
          settled = true
          cleanup()
          console.log('🔊 [AudioService] Autoplay exitoso')
          resolve()
        }
      }).catch((err) => {
        console.warn('Auto-play diferido o bloqueado, intentando de nuevo:', err)
        audio.play().then(() => {
          if (!settled) {
            settled = true
            cleanup()
            resolve()
          }
        }).catch((e) => {
          if (!settled) {
            settled = true
            cleanup()
            reject(e)
          }
        })
      })
    }

    const onError = (e: any) => {
      if (settled) return
      settled = true
      cleanup()
      console.error('Error reproduciendo stream:', e)
      reject(new Error('No se pudo reproducir el stream'))
    }

    const timeoutId = setTimeout(() => {
      if (!settled) {
        if (audio.readyState >= 2) {
          audio.play().catch(() => {})
          settled = true
          cleanup()
          resolve()
        } else {
          settled = true
          cleanup()
          reject(new Error('Timeout cargando stream de audio'))
        }
      }
    }, 10000)

    audio.addEventListener('playing', onPlaying, { once: true })
    audio.addEventListener('canplay', onCanPlay, { once: true })
    audio.addEventListener('error', onError, { once: true })
  })
}

export const setLocalAudioVolume = (volume: number): void => {
  const audio = getAudioInstance()
  audio.volume = Math.max(0, Math.min(1, volume / 100))
}

export const playLocalTrack = (path: string): Promise<void> => {
  return playStream(`file://${path}`)
}

export const pauseLocalAudio = (): void => {
  const audio = getAudioInstance()
  if (!audio.paused) {
    audio.pause()
  }
}

export const resumeLocalAudio = (): void => {
  const audio = getAudioInstance()
  if (audio.paused) {
    audio.play()
  }
}

export const setLocalAudioCurrentTime = (time: number): void => {
  const audio = getAudioInstance()
  audio.currentTime = time
}

export const getLocalAudioCurrentTime = (): number => {
  const audio = getAudioInstance()
  return audio.currentTime || 0
}

export const getLocalAudioDuration = (): number => {
  const audio = getAudioInstance()
  return audio.duration || 0
}

export const onLocalAudioTimeUpdate = (
  callback: (currentTime: number, duration: number) => void,
): void => {
  const audio = getAudioInstance()
  audio.ontimeupdate = () => {
    if (audio.duration > 0) {
      callback(audio.currentTime, audio.duration)
    }
  }
}

export const onLocalAudioEnded = (callback: () => void): void => {
  const audio = getAudioInstance()
  audio.onended = () => {
    // Limpiamos el evento tras ejecutarse para evitar bucles
    audio.onended = null
    callback()
  }
}

export const destroyLocalAudio = (): void => {
  if (localAudio) {
    localAudio.pause()
    localAudio.src = ''
    localAudio = null
  }
}

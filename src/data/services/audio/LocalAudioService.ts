let localAudio: HTMLAudioElement | null = null

const getAudioInstance = (): HTMLAudioElement => {
  if (!localAudio) {
    localAudio = new Audio()
  }
  return localAudio
}

export const initLocalAudio = (): HTMLAudioElement => {
  return getAudioInstance()
}

export const playLocalTrack = (path: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const audio = getAudioInstance()

    audio.src = `file://${path}`
    audio.load()

    const onCanPlay = () => {
      audio.play()
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('error', onError)
      resolve()
    }

    const onError = (e: any) => {
      console.error('Error reproduciendo audio local:', e)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('error', onError)
      reject(new Error('No se pudo reproducir el archivo'))
    }

    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('error', onError)
  })
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
    callback(audio.currentTime, audio.duration)
  }
}

export const onLocalAudioEnded = (callback: () => void): void => {
  const audio = getAudioInstance()
  audio.onended = callback
}

export const destroyLocalAudio = (): void => {
  if (localAudio) {
    localAudio.pause()
    localAudio.src = ''
    localAudio = null
  }
}

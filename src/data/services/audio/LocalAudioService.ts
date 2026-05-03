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

export const playStream = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const audio = getAudioInstance()
    audio.src = url
    audio.load()

    const onCanPlay = () => {
      audio.play().then(resolve).catch((err) => {
        console.warn('Auto-play bloqueado, intentando de nuevo tras interacción:', err);
        // Intentar reproducir de nuevo si falla por políticas de navegador
        audio.play().then(resolve).catch(reject);
      })
    }

    const onError = (e: any) => {
      console.error('Error reproduciendo stream:', e)
      reject(new Error('No se pudo reproducir el stream'))
    }

    audio.addEventListener('canplayonce', onCanPlay, { once: true })
    audio.addEventListener('error', onError, { once: true })
  })
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

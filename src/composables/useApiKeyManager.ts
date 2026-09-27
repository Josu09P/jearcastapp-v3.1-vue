import { ref, computed } from 'vue'
import { getApiKeys } from '@/domain/usecases/users/GetApiKeysUseCase'
import { toggleApiKeyStatus } from '@/domain/usecases/users/UpdateApiKeyUseCase'
import { searchYoutube } from '@/data/services/youtube/SearchYoutube'
import { useUserStore } from '@/stores/user'
import type { ApiKeyModel } from '@/domain/models/UserModel'

export const useApiKeyManager = () => {
  const userStore = useUserStore()
  const apiKeys = ref<ApiKeyModel[]>([])
  const currentApiKeyIndex = ref(-1)
  const quotaExceeded = ref(false)
  const usingFirestoreKeys = ref(false)

  const activeApiKeys = computed(() => {
    return apiKeys.value.filter((key) => key.isActive)
  })

  const saveApiKeyToLocalStorage = (key: string) => {
    if (userStore.id) {
      const userData = {
        id: userStore.id,
        name: userStore.name,
        email: userStore.email,
        apikeyYoutube: key,
        create_at: userStore.create_at,
      }
      userStore.setUser(userData)
      console.log('[OK] API Key guardada en localStorage')
    }
  }

  const testApiKey = async (key: string): Promise<boolean> => {
    try {
      await searchYoutube('test', key)
      return true
    } catch (error: any) {
      console.log(`[ERROR] Key falló: ${error.message}`)
      return false
    }
  }

  const loadApiKeysFromFirestore = async () => {
    if (!userStore.id) return false
    try {
      const keys = await getApiKeys(userStore.id)
      apiKeys.value = keys
      console.log(`[INFO] Cargadas ${keys.length} keys desde Firestore`)
      return keys.length > 0
    } catch (error) {
      console.error('Error cargando keys:', error)
      return false
    }
  }

  const initialize = async (): Promise<boolean> => {
    // 1. Cargar desde Firestore primero (múltiples keys gestionadas)
    const hasFirestoreKeys = await loadApiKeysFromFirestore()
    if (hasFirestoreKeys && apiKeys.value.length > 0) {
      if (activeApiKeys.value.length === 0) {
        console.log('[AUTO-ACTIVATE] Todas las API keys estaban inactivas. Activando automáticamente la primera key.')
        const firstKey = apiKeys.value[0]
        if (userStore.id) {
          try {
            await toggleApiKeyStatus(userStore.id, firstKey)
            await loadApiKeysFromFirestore()
          } catch (e) {
            console.error('Error al auto-activar primera key:', e)
          }
        }
      }

      if (activeApiKeys.value.length > 0) {
        usingFirestoreKeys.value = true
        currentApiKeyIndex.value = 0
        saveApiKeyToLocalStorage(activeApiKeys.value[0].key)
        console.log('[OK] API Key de Firestore lista para usar (sin gastar cuota en pruebas)')
        return true
      }
    }

    // 2. Usar key de localStorage si existe
    if (userStore.apikeyYoutube) {
      console.log('[OK] Usando API Key de configuración de usuario')
      usingFirestoreKeys.value = false
      currentApiKeyIndex.value = 0
      apiKeys.value = [
        {
          key: userStore.apikeyYoutube,
          service: 'youtube',
          isActive: true,
          created_at: new Date(),
        },
      ]
      return true
    }

    currentApiKeyIndex.value = -1
    return false
  }

  const switchToNextKey = async (): Promise<boolean> => {
    quotaExceeded.value = true

    if (usingFirestoreKeys.value) {
      const currentKey = activeApiKeys.value[currentApiKeyIndex.value]
      if (currentKey && userStore.id) {
        console.warn(`[FAILOVER] Desactivando key agotada: ${currentKey.key.slice(-4)}`)
        await toggleApiKeyStatus(userStore.id, currentKey)
      }
      await loadApiKeysFromFirestore()

      if (activeApiKeys.value.length > 0) {
        currentApiKeyIndex.value = 0
        const newKey = activeApiKeys.value[0]
        saveApiKeyToLocalStorage(newKey.key)
        console.log(`[RELOAD] Conmutando a la siguiente API Key activa`)
        return true
      } else {
        currentApiKeyIndex.value = -1
        usingFirestoreKeys.value = false
        console.warn('[FAILOVER] Se agotaron todas las API Keys de Firestore')
        return false
      }
    } else {
      console.log('[RELOAD] Key local agotada, buscando alternativas en Firestore...')
      const hasKeys = await loadApiKeysFromFirestore()
      if (hasKeys && activeApiKeys.value.length > 0) {
        usingFirestoreKeys.value = true
        currentApiKeyIndex.value = 0
        const newKey = activeApiKeys.value[0]
        saveApiKeyToLocalStorage(newKey.key)
        console.log(`[RELOAD] Conmutado a key de respaldo de Firestore`)
        return true
      } else {
        currentApiKeyIndex.value = -1
        console.warn('[FAILOVER] No hay más API Keys disponibles')
        return false
      }
    }
  }

  const getCurrentKey = (): string | null => {
    if (usingFirestoreKeys.value && currentApiKeyIndex.value >= 0) {
      return activeApiKeys.value[currentApiKeyIndex.value]?.key || null
    }
    return userStore.apikeyYoutube || null
  }

  const executeWithFailover = async <T>(fn: (key: string) => Promise<T>): Promise<T | null> => {
    if (currentApiKeyIndex.value === -1) {
      const initialized = await initialize()
      if (!initialized) {
        return null // Sin keys disponibles, permitir fallback a YTDLP
      }
    }

    const currentKey = getCurrentKey()
    if (!currentKey) return null

    try {
      return await fn(currentKey)
    } catch (error: any) {
      const errorMsg = error.message?.toLowerCase() || ''
      const isQuotaError =
        errorMsg.includes('quota') ||
        errorMsg.includes('403') ||
        errorMsg.includes('exceeded')

      if (isQuotaError) {
        console.warn(`[API Key Manager] Cuota agotada en key actual. Conmutando a la siguiente...`)
        const hasNext = await switchToNextKey()
        if (hasNext) {
          return executeWithFailover(fn)
        } else {
          console.warn(`[API Key Manager] Todas las API Keys agotaron su cuota. Activando respaldo YTDLP.`)
          return null
        }
      }
      throw error
    }
  }

  return {
    apiKeys,
    currentApiKeyIndex,
    quotaExceeded,
    usingFirestoreKeys,
    activeApiKeys,
    initialize,
    switchToNextKey,
    getCurrentKey,
    executeWithFailover,
    loadApiKeysFromFirestore,
  }
}

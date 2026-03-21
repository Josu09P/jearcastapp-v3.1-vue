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
      console.log('✅ API Key guardada en localStorage')
    }
  }

  const testApiKey = async (key: string): Promise<boolean> => {
    try {
      await searchYoutube('test', key)
      return true
    } catch (error: any) {
      console.log(`❌ Key falló: ${error.message}`)
      return false
    }
  }

  const loadApiKeysFromFirestore = async () => {
    if (!userStore.id) return false
    try {
      const keys = await getApiKeys(userStore.id)
      apiKeys.value = keys
      console.log(`📦 Cargadas ${keys.length} keys desde Firestore`)
      return keys.length > 0
    } catch (error) {
      console.error('Error cargando keys:', error)
      return false
    }
  }

  const initialize = async (): Promise<boolean> => {
    // 1. Probar key principal de localStorage
    if (userStore.apikeyYoutube) {
      const works = await testApiKey(userStore.apikeyYoutube)
      if (works) {
        console.log('✅ Usando API Key principal de localStorage')
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
      console.log('⚠️ Key principal falló, buscando en Firestore...')
    }

    // 2. Cargar desde Firestore
    const hasKeys = await loadApiKeysFromFirestore()
    if (hasKeys && activeApiKeys.value.length > 0) {
      usingFirestoreKeys.value = true
      // Probar primera key
      const firstKey = activeApiKeys.value[0]
      const works = await testApiKey(firstKey.key)
      if (works) {
        saveApiKeyToLocalStorage(firstKey.key)
        currentApiKeyIndex.value = 0
        console.log('✅ Key de Firestore funciona, guardada en localStorage')
        return true
      } else {
        await toggleApiKeyStatus(userStore.id!, firstKey)
        await loadApiKeysFromFirestore()
      }
    }

    return activeApiKeys.value.length > 0
  }

  const switchToNextKey = async () => {
    quotaExceeded.value = true

    if (usingFirestoreKeys.value) {
      const currentKey = activeApiKeys.value[currentApiKeyIndex.value]
      if (currentKey) {
        await toggleApiKeyStatus(userStore.id!, currentKey)
      }
      await loadApiKeysFromFirestore()

      if (activeApiKeys.value.length > 0) {
        currentApiKeyIndex.value = 0
        const newKey = activeApiKeys.value[0]
        saveApiKeyToLocalStorage(newKey.key)
        console.log(`🔄 Cambiando a nueva API Key`)
      } else {
        currentApiKeyIndex.value = -1
        usingFirestoreKeys.value = false
        console.log('❌ No hay más keys disponibles')
      }
    } else {
      console.log('🔄 Key principal falló, cambiando a Firestore...')
      const hasKeys = await loadApiKeysFromFirestore()
      if (hasKeys && activeApiKeys.value.length > 0) {
        usingFirestoreKeys.value = true
        currentApiKeyIndex.value = 0
        const newKey = activeApiKeys.value[0]
        saveApiKeyToLocalStorage(newKey.key)
        console.log(`🔄 Cambiando a key de respaldo`)
      } else {
        currentApiKeyIndex.value = -1
        console.log('❌ No hay keys disponibles')
      }
    }

    setTimeout(() => {
      quotaExceeded.value = false
    }, 3000)
  }

  const getCurrentKey = (): string | null => {
    if (usingFirestoreKeys.value && currentApiKeyIndex.value >= 0) {
      return activeApiKeys.value[currentApiKeyIndex.value]?.key
    }
    return userStore.apikeyYoutube
  }

  const executeWithFailover = async <T>(fn: (key: string) => Promise<T>): Promise<T> => {
    if (currentApiKeyIndex.value === -1) {
      const initialized = await initialize()
      if (!initialized) {
        throw new Error('No hay API Keys disponibles')
      }
    }

    try {
      const currentKey = getCurrentKey()
      if (!currentKey) throw new Error('No hay API Key disponible')
      return await fn(currentKey)
    } catch (error: any) {
      if (error.message?.includes('quota') || error.message?.includes('403')) {
        await switchToNextKey()
        return executeWithFailover(fn)
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

import type { RecommendedSongModel } from '@/domain/models/RecommendedSongModel'

const DB_NAME = 'JearCastLocalDB'
const DB_VERSION = 1
const STORE_NAME = 'topic_songs'

let dbInstance: IDBDatabase | null = null

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance)
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB no está disponible en este entorno'))
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'topicId' })
      }
    }

    request.onsuccess = (event: Event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result
      resolve(dbInstance)
    }

    request.onerror = (event: Event) => {
      console.error('Error abriendo IndexedDB JearCastLocalDB:', event)
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

// Fallback en memoria si IndexedDB fallara
const memoryFallback = new Map<string, RecommendedSongModel[]>()

export const topicsStorageService = {
  /**
   * Obtiene las canciones indexadas para un tema específico
   */
  async getTopicSongs(topicId: string): Promise<RecommendedSongModel[]> {
    try {
      const db = await openDB()
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const request = store.get(topicId)

        request.onsuccess = () => {
          if (request.result && Array.isArray(request.result.songs)) {
            resolve(request.result.songs)
          } else {
            resolve([])
          }
        }

        request.onerror = () => {
          resolve(memoryFallback.get(topicId) || [])
        }
      })
    } catch {
      return memoryFallback.get(topicId) || []
    }
  },

  /**
   * Guarda o reemplaza las canciones indexadas para un tema
   */
  async saveTopicSongs(topicId: string, songs: RecommendedSongModel[]): Promise<void> {
    memoryFallback.set(topicId, songs)
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const record = {
          topicId,
          songs,
          updatedAt: Date.now()
        }
        const request = store.put(record)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (e) {
      console.warn('Fallo al guardar en IndexedDB, usando fallback:', e)
    }
  },

  /**
   * Añade nuevas canciones únicas (evitando duplicados por video_id) y las indexa
   */
  async appendTopicSongs(topicId: string, newSongs: RecommendedSongModel[]): Promise<RecommendedSongModel[]> {
    const current = await this.getTopicSongs(topicId)
    const existingIds = new Set(current.map(s => s.video_id))
    const freshSongs = newSongs.filter(s => !existingIds.has(s.video_id))

    const merged = [...current, ...freshSongs]
    await this.saveTopicSongs(topicId, merged)
    return merged
  },

  /**
   * Elimina la lista indexada de un tema (para cuando el usuario solicita Refrescar)
   */
  async clearTopicSongs(topicId: string): Promise<void> {
    memoryFallback.delete(topicId)
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const request = store.delete(topicId)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (e) {
      console.warn('Fallo al limpiar tema en IndexedDB:', e)
    }
  },

  /**
   * Obtiene todos los temas indexados en un diccionario para carátulas y conteos
   */
  async getAllTopicRecords(): Promise<Record<string, RecommendedSongModel[]>> {
    const result: Record<string, RecommendedSongModel[]> = {}
    try {
      const db = await openDB()
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const request = store.getAll()

        request.onsuccess = () => {
          if (Array.isArray(request.result)) {
            for (const item of request.result) {
              if (item.topicId && Array.isArray(item.songs)) {
                result[item.topicId] = item.songs
              }
            }
          }
          resolve(result)
        }

        request.onerror = () => resolve(result)
      })
    } catch {
      memoryFallback.forEach((songs, topicId) => {
        result[topicId] = songs
      })
      return result
    }
  }
}

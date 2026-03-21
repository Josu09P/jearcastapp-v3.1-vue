import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/firebase.config'
import type { ApiKeyModel } from '../../../domain/models/UserModel'

export const ApiKeyService = {
  // Obtener todas las API Keys
  async getApiKeys(userId: string): Promise<ApiKeyModel[]> {
    try {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        return userSnap.data().apiKeys || []
      }
      return []
    } catch (error) {
      console.error('Error obteniendo API Keys:', error)
      throw error
    }
  },

  // Agregar nueva API Key
  async addApiKey(userId: string, apiKey: Omit<ApiKeyModel, 'created_at'>) {
    try {
      const userRef = doc(db, 'users', userId)
      const newKey = {
        ...apiKey,
        created_at: new Date(),
      }

      await updateDoc(userRef, {
        apiKeys: arrayUnion(newKey),
      })

      return newKey
    } catch (error) {
      console.error('Error agregando API Key:', error)
      throw error
    }
  },

  // Eliminar API Key
  async removeApiKey(userId: string, apiKey: ApiKeyModel) {
    try {
      const userRef = doc(db, 'users', userId)

      await updateDoc(userRef, {
        apiKeys: arrayRemove(apiKey),
      })

      return true
    } catch (error) {
      console.error('Error eliminando API Key:', error)
      throw error
    }
  },

  // Actualizar API Key existente
  async updateApiKey(userId: string, oldKey: ApiKeyModel, newKey: Partial<ApiKeyModel>) {
    try {
      const userRef = doc(db, 'users', userId)

      // Primero removemos la vieja
      await updateDoc(userRef, {
        apiKeys: arrayRemove(oldKey),
      })

      // Luego agregamos la actualizada
      const updatedKey = {
        ...oldKey,
        ...newKey,
        created_at: oldKey.created_at,
      }

      await updateDoc(userRef, {
        apiKeys: arrayUnion(updatedKey),
      })

      return updatedKey
    } catch (error) {
      console.error('Error actualizando API Key:', error)
      throw error
    }
  },

  // Desactivar API Key (sin eliminar)
  async toggleApiKeyStatus(userId: string, apiKey: ApiKeyModel) {
    try {
      const updatedKey = {
        ...apiKey,
        isActive: !apiKey.isActive,
      }

      return await this.updateApiKey(userId, apiKey, { isActive: !apiKey.isActive })
    } catch (error) {
      console.error('Error cambiando estado API Key:', error)
      throw error
    }
  },
}

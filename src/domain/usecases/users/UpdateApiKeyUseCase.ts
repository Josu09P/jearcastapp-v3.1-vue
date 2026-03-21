import { ApiKeyService } from '@/data/services/auth/ApiKeyService'
import type { ApiKeyModel } from '@/domain/models/UserModel'

export const addApiKey = async (userId: string, apiKey: Omit<ApiKeyModel, 'created_at'>) => {
  return ApiKeyService.addApiKey(userId, apiKey)
}

export const removeApiKey = async (userId: string, apiKey: ApiKeyModel) => {
  return ApiKeyService.removeApiKey(userId, apiKey)
}

export const updateApiKey = async (
  userId: string,
  oldKey: ApiKeyModel,
  newKey: Partial<ApiKeyModel>,
) => {
  return ApiKeyService.updateApiKey(userId, oldKey, newKey)
}

export const toggleApiKeyStatus = async (userId: string, apiKey: ApiKeyModel) => {
  return ApiKeyService.toggleApiKeyStatus(userId, apiKey)
}

import { ApiKeyService } from '@/data/services/auth/ApiKeyService'

export const getApiKeys = async (userId: string) => {
  return ApiKeyService.getApiKeys(userId)
}

import { UpdateUserService } from '@/data/services/auth/UpdateUserService'
import type { UserDetailModel, UserUpdateModel } from '@/domain/models/UserModel'

export const updateUser = async (
  userId: string,
  data: UserUpdateModel,
): Promise<UserDetailModel> => {
  try {
    return await UpdateUserService(userId, data)
  } catch (error) {
    console.error('Error en updateUser use case:', error)
    throw error
  }
}

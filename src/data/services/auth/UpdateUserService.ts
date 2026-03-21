import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { updateEmail, updatePassword } from 'firebase/auth'
import { db, auth } from '../../firebase/firebase.config'
import type { UserDetailModel, UserUpdateModel } from '../../../domain/models/UserModel'

export const UpdateUserService = async (
  userId: string,
  data: UserUpdateModel,
): Promise<UserDetailModel> => {
  try {
    const userRef = doc(db, 'users', userId)
    const currentUser = auth.currentUser

    if (!currentUser) {
      throw new Error('Usuario no autenticado')
    }

    // Actualizar email en Firebase Auth si es necesario
    if (data.email && data.email !== currentUser.email) {
      await updateEmail(currentUser, data.email)
    }

    // Actualizar contraseña si se proporciona
    if (data.password) {
      await updatePassword(currentUser, data.password)
    }

    // Preparar datos para Firestore
    const firestoreData: Partial<UserDetailModel> = {
      name: data.name,
      email: data.email,
      apikeyYoutube: data.apikeyYoutube,
      update_at: new Date(),
    }

    // Remover undefined values
    Object.keys(firestoreData).forEach(
      (key) =>
        firestoreData[key as keyof typeof firestoreData] === undefined &&
        delete firestoreData[key as keyof typeof firestoreData],
    )

    // Solo actualizar si hay datos para cambiar
    if (Object.keys(firestoreData).length > 0) {
      await updateDoc(userRef, firestoreData)
    }

    // Obtener usuario actualizado
    const updatedDoc = await getDoc(userRef)
    const userData = updatedDoc.data() as Omit<UserDetailModel, 'id'>

    return {
      id: userId,
      ...userData,
    }
  } catch (error) {
    console.error('Error actualizando usuario:', error)
    throw error
  }
}

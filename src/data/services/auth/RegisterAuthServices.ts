import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase/firebase.config'
import type { UserDetailModel, UserRegisterModel } from '../../../domain/models/UserModel'

export const RegisterAuthServices = async (data: UserRegisterModel): Promise<UserDetailModel> => {
  const { email, password, name, apikeyYoutube } = data
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const uid = userCredential.user.uid

  const userDoc = {
    name,
    email,
    create_at: new Date(),
    apikeyYoutube,
  }

  await setDoc(doc(db, 'users', uid), userDoc)

  return { id: uid, ...userDoc, email, name }
}

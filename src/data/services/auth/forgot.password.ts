import { auth } from '@/data/firebase/firebase.config'
import { sendPasswordResetEmail } from 'firebase/auth'

export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email)
}

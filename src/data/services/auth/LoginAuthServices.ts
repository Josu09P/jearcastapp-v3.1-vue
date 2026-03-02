import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase.config";
import type { UserDetailModel, UserLoginModel } from "../../../domain/models/UserModel";

export const login = async (data: UserLoginModel): Promise<UserDetailModel> => {
  const { email, password } = data;
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  const docSnap = await getDoc(doc(db, 'users', uid));
  if (!docSnap.exists()) throw new Error('Usuario no encontrado.');

  return { id: uid, ...docSnap.data() } as UserDetailModel;
};
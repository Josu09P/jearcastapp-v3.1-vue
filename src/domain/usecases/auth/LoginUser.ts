
import { login } from "@/data/services/auth/LoginAuthServices";
import type { UserDetailModel, UserLoginModel } from "@/domain/models/UserModel";

export const loginUser = async (data: UserLoginModel): Promise<UserDetailModel> => {
  if (!data.email || !data.password) {
    throw new Error("Correo y contraseña son obligatorios.");
  }
  return login(data);
};

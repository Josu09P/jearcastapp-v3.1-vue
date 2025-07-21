import { RegisterAuthServices } from "@/data/services/auth/RegisterAuthServices";
import type { UserDetailModel, UserRegisterModel } from "@/domain/models/UserModel";

export const registerUser = async (data: UserRegisterModel): Promise<UserDetailModel> => {
  if (data.password !== data.confirmPassword) {
    throw new Error('Las contraseñas no coinciden.');
  }
  return RegisterAuthServices(data);
};

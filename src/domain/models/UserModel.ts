export interface UserRegisterModel {
    name: string;
    email: string;  
    password: string;
    confirmPassword: string;
    create_at?: Date;
    apikeyYoutube?: string;
}

export interface UserDetailModel{
    id: string;
    name: string;
    email: string;
    apikeyYoutube?: string;
    update_at?: Date;
    create_at?: Date;
}


export interface UserLoginModel {
    email: string;
    password: string;
}
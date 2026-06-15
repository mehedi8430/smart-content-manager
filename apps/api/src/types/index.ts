export interface TApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface TUser {
  email: string;
  id: string;
  passwordHash?: string;
  refreshToken?: string | null;
  createdAt?: Date;
}

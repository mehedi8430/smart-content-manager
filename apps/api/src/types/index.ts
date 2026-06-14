export interface TApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

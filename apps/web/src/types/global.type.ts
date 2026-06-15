export interface TApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

export interface TUser {
    id: string;
    email: string;
}

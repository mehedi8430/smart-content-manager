import { TApiResponse, TUser } from "./global.type";

export type TLoginPayload = {
    email: string;
    password: string;
};

export type TLoginResponse = TApiResponse<{
    user: TUser;
    accessToken: string;
    refreshToken: string;
}>;

export type TSignupPayload = {
    email: string;
    password: string;
};

export type TSignupResponse = TApiResponse<{
    user: TUser;
}>;

export type TLogoutResponse = TApiResponse<void>;

export type TGetMeResponse = TApiResponse<{
    user: TUser;
}>;

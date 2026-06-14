import { TApiResponse } from "./global.type";

export type TLoginPayload = {
    email: string;
    password: string;
};

export type TLoginResponse = TApiResponse<{
    user: {
        id: string;
        email: string;
    };
    accessToken: string;
    refreshToken: string;
}>;

export type TSignupPayload = {
    email: string;
    password: string;
};

export type TSignupResponse = TApiResponse<{
    user: {
        id: string;
        email: string;
    };
}>;

export type TLogoutResponse = TApiResponse<void>;

import { CookieOptions, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';

export const generateAccessToken = (userId: string, res: Response): string => {
    const secret = process.env.ACCESS_TOKEN_SECRET;

    if (!secret) {
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }

    const expiresIn = (process.env.ACCESS_TOKEN_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];

    const accessToken = jwt.sign({ id: userId }, secret, { expiresIn });

    // send access token in cookies
    const options: CookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    };

    res.cookie("accessToken", accessToken, options);

    return accessToken;
};

export const generateRefreshToken = (userId: string, res: Response): string => {
    const secret = process.env.REFRESH_TOKEN_SECRET;

    if (!secret) {
        throw new Error('REFRESH_TOKEN_SECRET is not defined');
    }

    const expiresIn = (process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];

    const refreshToken = jwt.sign({ id: userId }, secret, { expiresIn });

    // send refresh token in cookies
    const options: CookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    };

    res.cookie("refreshToken", refreshToken, options);

    return refreshToken;
};
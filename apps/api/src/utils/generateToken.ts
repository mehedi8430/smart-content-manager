import { prisma } from '@/config/db';
import { CookieOptions, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { sendError } from './apiResponse';

export const generateAccessToken = (userId: string, res: Response): string => {
    const secret = process.env.ACCESS_TOKEN_SECRET;

    if (!secret) {
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }

    const expiresIn = (process.env.ACCESS_TOKEN_EXPIRES_IN ??
        '1d') as SignOptions['expiresIn'];

    const accessToken = jwt.sign({ id: userId }, secret, { expiresIn });

    // send access token in cookies
    const options: CookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 1, // 1 day
    };

    res.cookie('accessToken', accessToken, options);

    return accessToken;
};

export const generateRefreshToken = async (
    userId: string,
    res: Response
): Promise<string> => {
    try {
        const secret = process.env.REFRESH_TOKEN_SECRET;

        if (!secret) {
            throw new Error('REFRESH_TOKEN_SECRET is not defined');
        }

        const expiresIn = (process.env.REFRESH_TOKEN_EXPIRES_IN ??
            '7d') as SignOptions['expiresIn'];
        const refreshToken = jwt.sign({ id: userId }, secret, { expiresIn });

        // send refresh token in cookies
        const options: CookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        };

        res.cookie('refreshToken', refreshToken, options);

        // save refresh token in db
        await prisma.user.update({
            where: { id: userId },
            data: { refreshToken },
        });

        return refreshToken;
    } catch (error) {
        sendError(res, 500, 'Internal server error');
        console.error(error);
        return '';
    }
};

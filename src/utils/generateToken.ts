import { Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';

export const generateToken = (userId: string, res: Response): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }

    const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];

    const token = jwt.sign({ id: userId }, secret, { expiresIn });

    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return token;
};
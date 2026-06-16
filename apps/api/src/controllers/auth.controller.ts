import { prisma } from '@/config/db';
import { sendError, sendResponse } from '@/utils/apiResponse';
import catchAsync from '@/utils/catchAsync';
import { CookieOptions, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '@/utils/generateToken';
import jwt from 'jsonwebtoken';

const register = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // user exists check
  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    sendError(res, 400, 'User already exists with this email');
    return;
  }

  // hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // create user
  const user = await prisma.user.create({
    data: { email, passwordHash: hashedPassword },
  });

  sendResponse(
    res,
    201,
    true,
    'User registered successfully',
    {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      }
    });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // check user exist in table
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    sendError(res, 400, 'Invalid email or password');
    return;
  }

  // verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    sendError(res, 400, 'Invalid email or password');
    return;
  }

  // generate access and refresh token
  const accessToken = generateAccessToken(user.id, res);
  const refreshToken = await generateRefreshToken(user.id, res);

  sendResponse(
    res,
    200,
    true,
    'User loggedin successfully',
    {
      user: {
        id: user.id,
        email: user.email,
      },
      accessToken,
      refreshToken
    });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  // clear refresh token from user table
  await prisma.user.update({
    where: { id: req.user?.id },
    data: { refreshToken: null },
  });

  // clear cookies
  const clearOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none' as const,
    maxAge: 0,
  };

  res.cookie("accessToken", "", clearOptions);
  res.cookie("refreshToken", "", clearOptions);

  sendResponse(res,
    200,
    true,
    "Logged out successfully"
  );
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, 200, true, 'User fetched successfully', {
    user: req.user
  });
});

const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    sendError(res, 401, 'No refresh token provided.');
    return;
  }

  const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string) as { id: string };

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });

  if (!user || user.refreshToken !== token) {
    sendError(res, 401, 'Invalid refresh token.');
    return;
  }

  // Issue new access token only
  generateAccessToken(user.id, res);

  sendResponse(res, 200, true, 'Token refreshed successfully', {
    id: user.id,
    email: user.email
  });
});

export {
  register,
  login,
  logout,
  getMe,
  refreshAccessToken
};

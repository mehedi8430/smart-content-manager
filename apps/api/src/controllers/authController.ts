import { prisma } from '@/config/db';
import { sendError, sendResponse } from '@/utils/apiResponse';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '@/utils/generateToken';

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
  const accesToken = generateAccessToken(user.id, res);
  const refreshToken = generateRefreshToken(user.id, res);

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
      accesToken,
      refreshToken
    });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  // todo: delete refresh token from db

  // clear cookies
  res.cookie("accessToken", "", {
    httpOnly: true,
    expires: new Date(),
  })
  res.cookie("refreshToken", "", {
    httpOnly: true,
    expires: new Date(),
  });

  sendResponse(res,
    200,
    true,
    "Logged out successfully"
  );
})

export { register, login, logout };
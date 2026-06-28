import { sendResponse } from '@/utils/apiResponse';
import { generateAccessToken, generateRefreshToken } from '@/utils/generateToken';
import catchAsync from '@/utils/catchAsync';
import { CookieOptions, Request, Response } from 'express';
import {
  register as registerService,
  login as loginService,
  logout as logoutService,
  refreshAccessToken as refreshAccessTokenService,
} from '@/services/auth.service';

/**
 * Auth Controller
 * Handles HTTP requests for authentication operations
 */

/**
 * Register a new user
 * @route POST /api/v1/auth/register
 * @returns Created user object
 */
const register = catchAsync(async (req: Request, res: Response) => {
  const user = await registerService(req.body);

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

/**
 * Login user
 * @route POST /api/v1/auth/login
 * @returns User object with tokens
 */
const login = catchAsync(async (req: Request, res: Response) => {
  const user = await loginService(req.body);

  // Generate access and refresh tokens
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

/**
 * Logout user
 * @route POST /api/v1/auth/logout
 * @auth Requires valid JWT token
 * @returns Success message
 */
const clearAuthCookies = (res: Response) => {
  const clearOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none' as const,
    path: '/',
    maxAge: 0,
  };

  res.cookie('accessToken', '', clearOptions);
  res.cookie('refreshToken', '', clearOptions);
};

const logout = catchAsync(async (req: Request, res: Response) => {
  await logoutService(req.user!.id);

  clearAuthCookies(res);

  sendResponse(res,
    200,
    true,
    "Logged out successfully"
  );
});

/**
 * Get current user
 * @route GET /api/v1/auth/me
 * @auth Requires valid JWT token
 * @returns Current user object
 */
const getMe = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, 200, true, 'User fetched successfully', {
    user: req.user
  });
});

/**
 * Refresh access token
 * @route POST /api/v1/auth/refresh-token
 * @returns New access token
 */
const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  try {
    const user = await refreshAccessTokenService(token);

    // Issue new access token
    const accessToken = generateAccessToken(user.id, res);

    sendResponse(res, 200, true, 'Token refreshed successfully', {
      id: user.id,
      email: user.email,
      accessToken,
    });
  } catch (error) {
    clearAuthCookies(res);
    throw error;
  }
});

export {
  register,
  login,
  logout,
  getMe,
  refreshAccessToken
};

import { prisma } from '@/config/db.config';
import { ApiError } from '@/utils/apiResponse';
import logger from '@/config/logger.config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { RegisterInput, LoginInput } from '@/validators/auth.validator';

/**
 * Auth service layer - handles all business logic and Prisma operations
 */

/**
 * Register a new user
 */
export const register = async (data: RegisterInput) => {
  try {
    const { email, password } = data;

    // Check if user already exists
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      throw new ApiError(400, 'User already exists with this email');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: { email, passwordHash: hashedPassword },
    });

    logger.info(`User registered: ${user.id}`);
    return user;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error('Error registering user:', error);
    throw new ApiError(500, 'Failed to register user');
  }
};

/**
 * Login user - verify credentials and return user
 */
export const login = async (data: LoginInput) => {
  try {
    const { email, password } = data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError(400, 'Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new ApiError(400, 'Invalid email or password');
    }

    logger.info(`User logged in: ${user.id}`);
    return user;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error('Error logging in user:', error);
    throw new ApiError(500, 'Failed to login');
  }
};

/**
 * Logout user - clear refresh token from database
 */
export const logout = async (userId: string) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    logger.info(`User logged out: ${userId}`);
    return { success: true };
  } catch (error) {
    logger.error('Error logging out user:', error);
    throw new ApiError(500, 'Failed to logout');
  }
};

/**
 * Refresh access token - verify refresh token and return user
 */
export const refreshAccessToken = async (token: string) => {
  try {
    if (!token) {
      throw new ApiError(401, 'No refresh token provided.');
    }

    // Verify refresh token
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string) as { id: string };

    // Get user
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.refreshToken !== token) {
      throw new ApiError(401, 'Invalid refresh token.');
    }

    logger.info(`Token refreshed for user: ${user.id}`);
    return user;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'Refresh token expired.');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, 'Invalid refresh token.');
    }
    logger.error('Error refreshing token:', error);
    throw new ApiError(500, 'Failed to refresh token');
  }
};

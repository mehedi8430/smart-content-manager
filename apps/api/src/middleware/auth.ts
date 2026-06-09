import { findUserById } from '@/repositories/userRepository';
import { sendError } from '@/utils/apiResponse';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      sendError(res, 401, 'Access denied. No token provided.');
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      role?: string;
    };
    const user = await findUserById(decoded.id);

    if (!user) {
      sendError(res, 401, 'Token is not valid');
      return;
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    sendError(res, 401, 'Token is not valid');
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as string)) {
      sendError(res, 403, 'Access denied. Insufficient permissions.');
      return;
    }
    next();
  };
};

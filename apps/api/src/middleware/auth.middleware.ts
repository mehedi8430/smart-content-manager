import { prisma } from '@/config/db';
import { sendError } from '@/utils/apiResponse';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// read the token from the request
// check if token is valid
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
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    console.log("req cookies:", req.cookies?.accessToken);
    // console.log("access token:", token);

    if (!token) {
      sendError(res, 401, 'Access denied. No token provided.');
      return;
    }

    // verify token and extract the user id
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as {
      id: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      sendError(res, 401, 'Token is not valid');
      return;
    }

    req.user = { id: user.id, email: user.email };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendError(res, 401, 'Token expired. Please refresh your token.');
      return;
    }

    sendError(res, 401, 'Token is not valid');
  }
};

// Middleware to allow access only to users with the specified roles.
// export const authorize = (...roles: string[]) => {
//   return (req: Request, res: Response, next: NextFunction): void => {
//     if (!req.user || !roles.includes(req.user.role as string)) {
//       sendError(res, 403, 'Access denied. Insufficient permissions.');
//       return;
//     }
//     next();
//   };
// };

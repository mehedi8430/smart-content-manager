import logger from '@/config/logger.config';
import { sendError } from '@/utils/apiResponse';
import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  status?: number;
  type?: string;
  code?: string;
  details?: string;
}

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // body-parser / http-errors put the status on `status` (and it may not survive
  // the spread above). Without this, a 413 payload and a 400 bad-JSON request
  // would both fall through to 500.
  if (typeof error.statusCode !== 'number' && typeof err.status === 'number') {
    error.statusCode = err.status;
  }

  // Clean up body-parser messages — no raw parser internals in the response.
  if (err.type === 'entity.too.large') {
    error.message = 'Request body too large';
  } else if (err.type === 'entity.parse.failed') {
    error.message = 'Invalid JSON payload';
  }

  logger.error(err);

  // Handle Prisma errors
  if (err.code === '22P02') {
    error = { ...error, statusCode: 404, message: 'Resource not found' };
  }

  if (err.code === '23505') {
    error = {
      ...error,
      statusCode: 400,
      message: 'Duplicate field value entered',
    };
  }

  // Handle ApiError details if present
  const details = err.details ? err.details : undefined;

  sendError(res, error.statusCode || 500, error.message || 'Server Error', details);
};

export default errorHandler;

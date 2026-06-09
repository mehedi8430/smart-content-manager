import logger from '@/config/logger';
import { sendError } from '@/utils/apiResponse';
import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  logger.error(err);

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

  sendError(res, error.statusCode || 500, error.message || 'Server Error');
};

export default errorHandler;

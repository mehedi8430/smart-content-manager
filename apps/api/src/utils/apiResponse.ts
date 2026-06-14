import { Response } from 'express';
import { TApiResponse } from '@/types';

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T
): Response => {
  const response: TApiResponse<T> = {
    success,
    message,
    ...(data && { data }),
  };

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  error?: string
): Response => {
  const response: TApiResponse = {
    success: false,
    message,
    ...(error && { error }),
  };

  return res.status(statusCode).json(response);
};

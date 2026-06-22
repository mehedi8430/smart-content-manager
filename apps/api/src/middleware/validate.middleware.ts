import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ApiError } from '@/utils/apiResponse';

type RequestSource = 'body' | 'query' | 'params';

type ValidationSchemas = Partial<Record<RequestSource, z.ZodType>>;

const formatZodErrors = (source: RequestSource, error: z.ZodError): string[] =>
  error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : source;
    return `${path}: ${issue.message}`;
  });

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const source of Object.keys(schemas) as RequestSource[]) {
      const schema = schemas[source];
      if (!schema) continue;

      const result = schema.safeParse(req[source]);

      if (!result.success) {
        errors.push(...formatZodErrors(source, result.error));
        continue;
      }

      req[source] = result.data;
    }

    if (errors.length > 0) {
      throw new ApiError(400, 'Validation failed', errors.join(', '));
    }

    next();
  };
};

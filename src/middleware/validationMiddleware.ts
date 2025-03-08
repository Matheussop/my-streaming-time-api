import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { catchAsync } from '../util/catchAsync';
import { StreamingServiceError } from './errorHandler';
import { ErrorMessages } from '../constants/errorMessages';

/**
 * Generic middleware for Zod validation
 * @param schema Zod schema for validation
 * @param source Source of the data to be validated (body, params, query)
 */
export const validate = (schema: AnyZodObject, source: 'body' | 'params' | 'query' = 'body') => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = await schema.parseAsync(req[source]);
    
    req[source] = data;
    
    next();
  });
}; 
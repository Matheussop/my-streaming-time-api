import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { objectIdSchema, toObjectId } from '../validators/common';
import { StreamingServiceError } from './errorHandler';
import { ErrorMessages } from '../constants/errorMessages';
import { catchAsync } from '../util/catchAsync';

// Extend the Request interface to include validatedIds
declare global {
  namespace Express {
    interface Request {
      validatedIds: Record<string, Types.ObjectId>;
    }
  }
}

/**
 * Middleware to validate if a parameter is a valid ObjectId
 * @param paramName Name of the parameter to be validated
 * @param source Source of the parameter (params, query, body)
 */
export const validateObjectId = (
  source: 'params' | 'query' | 'body' = 'params',
  paramName: string = 'id',
) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const value = req[source][paramName];
    if (!value) {
      throw new StreamingServiceError(ErrorMessages.INVALID_ID, 400);
    }
    
    // Validate the ID using the schema
    const result = objectIdSchema.safeParse(value);
    
    if (!result.success) {
      throw new StreamingServiceError(ErrorMessages.INVALID_ID_FORMAT(value), 400);
    }
    
    // Initialize validatedIds if it doesn't exist
    if (!req.validatedIds) {
      req.validatedIds = {};
    }
    
    req.validatedIds[paramName] = toObjectId(value);
    
    next();
  });
};

// Example of usage:
// router.get('/:id', validateObjectId('id'), controller.getById);

/**
 * Middleware to validate multiple ObjectIds
 * @param idMapping Mapping of parameter names and their sources
 */
export const validateMultipleObjectIds = (
  idMapping: Array<{ name: string; source: 'params' | 'query' | 'body' }>
) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.validatedIds) {
      req.validatedIds = {};
    }
    
    for (const { name, source } of idMapping) {
      const value = req[source][name];
      
      if (!value) {
        throw new StreamingServiceError(ErrorMessages.INVALID_ID, 400);
      }
      
      // Validate the ID using the schema
      const result = objectIdSchema.safeParse(value);
      
      if (!result.success) {
        throw new StreamingServiceError(ErrorMessages.INVALID_ID, 400);
      }
      
      // Convert the ID to ObjectId and store it
      req.validatedIds[name] = toObjectId(value);
    }
    
    next();
  });
};

// Example of usage:
// router.get('/:id/related/:relatedId', 
//   validateMultipleObjectIds([
//     { name: 'id', source: 'params' },
//     { name: 'relatedId', source: 'params' }
//   ]), 
//   controller.getRelated
// ); 
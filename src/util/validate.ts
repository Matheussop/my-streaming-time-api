import { Request, Response, NextFunction } from 'express';
import { StreamingServiceError } from '../middleware/errorHandler';

export const validateRequiredFields = (body: any, requiredFields: string[]): string[] => {
  const missingFields: string[] = [];
  requiredFields.forEach((field) => {
    if (!body[field]) {
      missingFields.push(field);
    }
  });
  return missingFields;
};

export const validateRequest = (req: Request, res: Response, next: NextFunction, requiredFields: string[]): void => {
  const missingFields = validateRequiredFields(req.body, requiredFields);
  if (missingFields.length > 0) {
    throw new StreamingServiceError(`The following parameters are required: ${missingFields.join(', ')}`, 400);
  } else {
    next();
  }
};

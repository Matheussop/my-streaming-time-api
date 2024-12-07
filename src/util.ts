import { Request, Response, NextFunction } from 'express';

export const validateRequiredFields = (body: any, requiredFields: string[]): string[] => {
  const missingFields: string[] = [];
  requiredFields.forEach(field => {
    if (!body[field]) {
      missingFields.push(field);
    }
  });
  return missingFields;
};

export const validateRequest = (req: Request, res: Response, next: NextFunction, requiredFields: string[]): void => {
  const missingFields = validateRequiredFields(req.body, requiredFields);
  if (missingFields.length > 0) {
    res.status(400).json({ message: `The following parameters are required: ${missingFields.join(', ')}` });
  } else {
    next();
  }
};
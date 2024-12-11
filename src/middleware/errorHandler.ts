import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import logger from '../config/logger';

export class StreamingServiceError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

interface ErrorResponse {
  status: string;
  message: string;
  stack?: string;
  errors?: any;
}

export const errorHandler = (
  err: Error | StreamingServiceError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err as StreamingServiceError;
  let statusCode = error.statusCode || 500;
  
  // Error logging
  logger.error({
    message: error.message,
    statusCode,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip,
    userId: (req as any).user?.id 
  });

  const response: ErrorResponse = {
    status: 'error',
    message: error.message || 'Internal Server Error'
  };

  // Mongoose Validation Error
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    response.message = 'Validation Error';
    response.errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // Mongoose CastError (Invalid ID)
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    response.message = 'Invalid ID format';
  }

  // Mongoose Duplicate Key Error
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    statusCode = 400;
    response.message = 'Duplicate field value entered';
  }

  if(statusCode === 500){
    response.message = 'Internal Server Error';
  }

  // Add stack trace in development environment
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}; 
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { StreamingServiceError, errorHandler } from '../errorHandler';

describe('Error Handling', () => {
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = {
      path: '/test',
      method: 'GET',
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
    };
    mockNext = jest.fn();
  });

  describe('StreamingServiceError Class', () => {
    it('should create a StreamingServiceError with correct properties', () => {
      const error = new StreamingServiceError('Test Error', 404, false);

      expect(error.message).toBe('Test Error');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(false);
      expect(error.stack).toBeDefined();
    });
  });

  describe('Error Handler Middleware', () => {
    it('should handle StreamingServiceError and send appropriate response', () => {
      const error = new StreamingServiceError('Not Found', 404);
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Not Found',
      });
    });

    it('should handle Mongoose ValidationError and send appropriate response', () => {
      const validationError = new mongoose.Error.ValidationError();
      validationError.errors = {
        fieldName: { path: 'fieldName', message: 'Field is required' } as any,
      };

      errorHandler(validationError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Validation Error',
        errors: [{ field: 'fieldName', message: 'Field is required' }],
      });
    });

    it('should handle Mongoose CastError and send appropriate response', () => {
      const castError = new mongoose.Error.CastError('ObjectId', 'invalid-id', 'id');

      errorHandler(castError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid ID format',
      });
    });

    it('should handle MongoServerError for duplicate keys and send appropriate response', () => {
      const mongoError = new Error('Duplicate key error') as any;
      mongoError.name = 'MongoServerError';
      mongoError.code = 11000;

      errorHandler(mongoError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Duplicate field value entered',
      });
    });

    it('should handle generic errors with status 500', () => {
      const genericError = new Error('Something went wrong');

      errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal Server Error',
      });
    });

    it('should include stack trace in development environment', () => {
      process.env.NODE_ENV = 'development';
      const genericError = new Error('Something went wrong');

      errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: genericError.stack,
        }),
      );

      process.env.NODE_ENV = 'test'; // Reset environment
    });
  });
});

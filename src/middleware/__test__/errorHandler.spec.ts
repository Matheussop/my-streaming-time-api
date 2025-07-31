import { Request, Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import { StreamingServiceError, errorHandler } from '../errorHandler';
import { z } from 'zod';
import { formatZodError } from '../../util/errorFormatter';
import { generateValidObjectId } from '../../util/__tests__/generateValidObjectId';

// Mock formatZodError
jest.mock('../../util/errorFormatter', () => ({
  formatZodError: jest.fn().mockReturnValue([{ path: 'field', message: 'Invalid field' }]),
}));

describe('Error Handling', () => {
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;
  let mockNext: NextFunction;
  let mockId: string | Types.ObjectId;
  beforeEach(() => {
    mockId = generateValidObjectId();
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
      user: { userId: mockId },
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

    it('should handle StreamingServiceError with correct properties and empty error', () => {
      const error = new Error();
      const mockRequestWithoutUser = { ...mockRequest, user: null } as unknown as Request;

      errorHandler(error, mockRequestWithoutUser as Request, mockResponse as Response, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal Server Error',
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
      mongoError.keyValue = { email: 'test@example.com' };

      errorHandler(mongoError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: "A record already exists with value 'test@example.com' for field 'email'",
        details: "The value 'test@example.com' is already in use for the field 'email'. Please choose a unique value for the field 'email'."
      });
    });

    it('should handle MongoServerError with undefined keyValue gracefully', () => {
      const mongoError = new Error('Duplicate key error') as any;
      mongoError.name = 'MongoServerError';
      mongoError.code = 11000;

      errorHandler(mongoError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: "A record already exists with value 'unknown' for field 'unknown'",
        details: "The value 'unknown' is already in use for the field 'unknown'. Please choose a unique value for the field 'unknown'."
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

    it('should handle Zod validation errors', () => {
      const zodError = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['field'],
          message: 'Invalid field',
        },
      ]);

      errorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        errors: [{ path: 'field', message: 'Invalid field' }],
        message: 'Invalid input data'
      });
      expect(formatZodError).toHaveBeenCalledWith(zodError);
    });

    it('should handle JSON syntax errors with undefined values', () => {
      const syntaxError = new SyntaxError('Unexpected token undefined in JSON at position 10');

      errorHandler(syntaxError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid JSON: The value "undefined" is not allowed in JSON. Use null for missing values.',
        details: 'Check your payload and replace undefined values with null or remove them.'
      });
    });

    it('should handle generic JSON syntax errors', () => {
      const syntaxError = new SyntaxError('Unexpected token } in JSON at position 10');

      errorHandler(syntaxError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid JSON: Syntax error in payload',
        details: 'Check if your JSON is formatted correctly.'
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

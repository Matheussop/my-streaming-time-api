import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { validateObjectId, validateMultipleObjectIds } from '../objectIdValidationMiddleware';
import { StreamingServiceError } from '../errorHandler';
import { ErrorMessages } from '../../constants/errorMessages';
import * as commonValidators from '../../validators/common';

// Mock the validators
jest.mock('../../validators/common', () => ({
  objectIdSchema: {
    safeParse: jest.fn(),
  },
  toObjectId: jest.fn((id) => new Types.ObjectId(id)),
}));

/**
 * Important to mock catchAsync so that the test is not impacted
 * by the promise that catchAsync returns
 */
jest.mock('../../util/catchAsync', () => ({
  catchAsync: (fn: Function) => fn
}));

describe('ObjectId Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let validObjectId: string;

  beforeEach(() => {
    validObjectId = new Types.ObjectId().toString();

    mockRequest = {
      params: { id: validObjectId },
      query: { userId: validObjectId },
      body: { movieId: validObjectId },
      validatedIds: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    // Reset mock implementations
    const objectIdSchemaMock = commonValidators.objectIdSchema.safeParse as jest.Mock;
    objectIdSchemaMock.mockReset();
    objectIdSchemaMock.mockImplementation(() => ({ success: true }));

    const toObjectIdMock = commonValidators.toObjectId as jest.Mock;
    toObjectIdMock.mockReset();
    toObjectIdMock.mockImplementation((id) => new Types.ObjectId(id));
  });

  describe('validateObjectId middleware', () => {
    it('should validate and convert a valid ObjectId from params', async () => {
      const middleware = validateObjectId();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.validatedIds).toBeDefined();
      expect(mockRequest.validatedIds!.id).toBeInstanceOf(Types.ObjectId);
      expect(mockRequest.validatedIds!.id.toString()).toBe(validObjectId);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should validate and convert a valid ObjectId from query', async () => {
      const middleware = validateObjectId('query', 'userId');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.validatedIds).toBeDefined();
      expect(mockRequest.validatedIds!.userId).toBeInstanceOf(Types.ObjectId);
      expect(mockRequest.validatedIds!.userId.toString()).toBe(validObjectId);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should validate and convert a valid ObjectId from body', async () => {
      const middleware = validateObjectId('body', 'movieId');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.validatedIds).toBeDefined();
      expect(mockRequest.validatedIds!.movieId).toBeInstanceOf(Types.ObjectId);
      expect(mockRequest.validatedIds!.movieId.toString()).toBe(validObjectId);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should initialize validatedIds if it does not exist', async () => {
      mockRequest.validatedIds = undefined;
      const middleware = validateObjectId();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.validatedIds).toBeDefined();
      expect(mockRequest.validatedIds!.id).toBeDefined();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should throw error if parameter is missing', async () => {
      mockRequest.params = {};
      const middleware = validateObjectId();

      await expect(async () => {
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).rejects.toThrow(StreamingServiceError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error if ObjectId is invalid', async () => {
      const objectIdSchemaMock = commonValidators.objectIdSchema.safeParse as jest.Mock;
      objectIdSchemaMock.mockImplementation(() => ({ success: false }));

      const middleware = validateObjectId();

      await expect(async () => {
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).rejects.toThrow(StreamingServiceError);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateMultipleObjectIds middleware', () => {
    it('should validate and convert multiple valid ObjectIds', async () => {
      const middleware = validateMultipleObjectIds([
        { name: 'id', source: 'params' },
        { name: 'userId', source: 'query' },
        { name: 'movieId', source: 'body' }
      ]);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.validatedIds).toBeDefined();
      const validatedIds = mockRequest.validatedIds!;
      expect(validatedIds.id).toBeInstanceOf(Types.ObjectId);
      expect(validatedIds.userId).toBeInstanceOf(Types.ObjectId);
      expect(validatedIds.movieId).toBeInstanceOf(Types.ObjectId);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should initialize validatedIds if it does not exist', async () => {
      mockRequest.validatedIds = undefined;
      const middleware = validateMultipleObjectIds([
        { name: 'id', source: 'params' }
      ]);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.validatedIds).toBeDefined();
      expect(mockRequest.validatedIds!.id).toBeDefined();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should throw error if any parameter is missing', async () => {
      mockRequest.body = {};
      const middleware = validateMultipleObjectIds([
        { name: 'id', source: 'params' },
        { name: 'movieId', source: 'body' }
      ]);

      await expect(async () => {
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).rejects.toThrow(StreamingServiceError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error if any ObjectId is invalid', async () => {
      const objectIdSchemaMock = commonValidators.objectIdSchema.safeParse as jest.Mock;
      // Make the second parameter fail validation
      objectIdSchemaMock.mockImplementationOnce(() => ({ success: true }))
                         .mockImplementationOnce(() => ({ success: false }));

      const middleware = validateMultipleObjectIds([
        { name: 'id', source: 'params' },
        { name: 'userId', source: 'query' }
      ]);

      await expect(async () => {
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).rejects.toThrow(StreamingServiceError);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should throw a specific error message for invalid IDs', async () => {
      mockRequest.params = { id: 'invalid-id' };
      const objectIdSchemaMock = commonValidators.objectIdSchema.safeParse as jest.Mock;
      objectIdSchemaMock.mockImplementation(() => ({ success: false }));

      const middleware = validateObjectId();

      try {
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Expected to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(StreamingServiceError);
        expect((error as StreamingServiceError).statusCode).toBe(400);
        expect((error as StreamingServiceError).message).toBe(ErrorMessages.INVALID_ID_FORMAT('invalid-id'));
      }
    });

    it('should throw a generic error message when ID is missing', async () => {
      mockRequest.params = {};
      const middleware = validateObjectId();

      try {
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Expected to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(StreamingServiceError);
        expect((error as StreamingServiceError).statusCode).toBe(400);
        expect((error as StreamingServiceError).message).toBe(ErrorMessages.INVALID_ID);
      }
    });
  });
}); 
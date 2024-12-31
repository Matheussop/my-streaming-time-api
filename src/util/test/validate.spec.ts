import { Request, Response, NextFunction } from 'express';
import { validateRequest, validateRequiredFields } from '../validate';
import { StreamingServiceError } from '../../middleware/errorHandler';

describe('Validation Functions', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  describe('validateRequiredFields', () => {
    it('should return empty array when all required fields are present', () => {
      const body = {
        name: 'John',
        email: 'john@example.com',
        password: 'passwordHashed',
      };
      const requiredFields = ['name', 'email', 'password'];

      const result = validateRequiredFields(body, requiredFields);

      expect(result).toEqual([]);
    });

    it('should return array of missing fields when some fields are missing', () => {
      const body = {
        name: 'John',
        password: 'passwordHashed',
      };
      const requiredFields = ['name', 'email', 'password'];

      const result = validateRequiredFields(body, requiredFields);

      expect(result).toEqual(['email']);
    });

    it('should return all required fields when body is empty', () => {
      const body = {};
      const requiredFields = ['name', 'email', 'password'];

      const result = validateRequiredFields(body, requiredFields);

      expect(result).toEqual(['name', 'email', 'password']);
    });

    it('should handle fields with null values as missing', () => {
      const body = {
        name: 'John',
        email: null,
        password: 'passwordHashed',
      };
      const requiredFields = ['name', 'email', 'password'];

      const result = validateRequiredFields(body, requiredFields);

      expect(result).toEqual(['email']);
    });

    it('should handle fields with undefined values as missing', () => {
      const body = {
        name: 'John',
        email: undefined,
        password: 'passwordHashed',
      };
      const requiredFields = ['name', 'email', 'password'];

      const result = validateRequiredFields(body, requiredFields);

      expect(result).toEqual(['email']);
    });

    it('should handle empty string values as missing', () => {
      const body = {
        name: 'John',
        email: '',
        password: 'passwordHashed',
      };
      const requiredFields = ['name', 'email', 'password'];

      const result = validateRequiredFields(body, requiredFields);

      expect(result).toEqual(['email']);
    });
  });

  describe('validateRequest', () => {
    beforeEach(() => {
      mockReq = {} as Partial<Request>;
      mockRes = jest.fn() as Partial<Response>;
      mockNext = jest.fn();
    });

    it('should call next() when all required fields are present', () => {
      mockReq.body = {
        name: 'John',
        email: 'john@example.com',
      };
      const requiredFields = ['name', 'email'];

      validateRequest(mockReq as Request, mockRes as Response, mockNext as NextFunction, requiredFields);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw StreamingServiceError when fields are missing', () => {
      mockReq.body = {
        name: 'John',
      };
      const requiredFields = ['name', 'email', 'password'];

      expect(() => {
        validateRequest(mockReq as Request, mockRes as Response, mockNext as NextFunction, requiredFields);
      }).toThrow(StreamingServiceError);
    });

    it('should include missing fields in error mess password', () => {
      mockReq.body = {
        name: 'John',
      };
      const requiredFields = ['name', 'email', 'password'];

      expect(() => {
        validateRequest(mockReq as Request, mockRes as Response, mockNext as NextFunction, requiredFields);
      }).toThrow('The following parameters are required: email, password');
    });

    it('should set correct error status code', () => {
      mockReq.body = {};
      const requiredFields = ['name', 'email'];

      try {
        validateRequest(mockReq as Request, mockRes as Response, mockNext as NextFunction, requiredFields);
      } catch (error: any) {
        expect(error).toBeInstanceOf(StreamingServiceError);
        expect(error.statusCode).toBe(400);
      }
    });

    it('should handle empty request body', () => {
      mockReq.body = {};
      const requiredFields = ['name', 'email'];

      expect(() => {
        validateRequest(mockReq as Request, mockRes as Response, mockNext as NextFunction, requiredFields);
      }).toThrow('The following parameters are required: name, email');
    });

    it('should handle request body with all invalid values', () => {
      mockReq.body = {
        name: '',
        email: null,
        password: undefined,
      };
      const requiredFields = ['name', 'email', 'password'];

      expect(() => {
        validateRequest(mockReq as Request, mockRes as Response, mockNext as NextFunction, requiredFields);
      }).toThrow('The following parameters are required: name, email, password');
    });
  });
});

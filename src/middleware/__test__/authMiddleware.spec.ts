import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthMiddleware } from '../authMiddleware';
import { StreamingServiceError } from '../errorHandler';

// Mock TokenService
jest.mock('../../services/tokenService', () => {
  const mockVerifyToken = jest.fn();
  const mockVerifyRefreshToken = jest.fn();
  const mockGenerateToken = jest.fn();
  const mockGenerateRefreshToken = jest.fn();
  
  return {
    TokenService: {
      getInstance: jest.fn().mockReturnValue({
        verifyToken: mockVerifyToken,
        verifyRefreshToken: mockVerifyRefreshToken,
        generateToken: mockGenerateToken,
        generateRefreshToken: mockGenerateRefreshToken
      })
    },
    mockVerifyToken,
    mockVerifyRefreshToken,
    mockGenerateToken,
    mockGenerateRefreshToken
  };
});

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let mockUserId: string;

  beforeEach(() => {
    authMiddleware = new AuthMiddleware();
    mockUserId = new Types.ObjectId().toString();
    
    mockRequest = {
      headers: {
        authorization: `Bearer valid-token`
      },
      body: {
        refreshToken: 'valid-refresh-token'
      },
      path: ""
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    mockNext = jest.fn();

    // Reset and setup mock implementations
    const { mockVerifyToken, mockVerifyRefreshToken, mockGenerateToken, mockGenerateRefreshToken } = require('../../services/tokenService');
    
    mockVerifyToken.mockReset();
    mockVerifyRefreshToken.mockReset();
    mockGenerateToken.mockReset();
    mockGenerateRefreshToken.mockReset();
    
    mockVerifyToken.mockReturnValue({ userId: mockUserId });
    mockVerifyRefreshToken.mockReturnValue({ userId: mockUserId });
    mockGenerateToken.mockReturnValue('new-token');
    mockGenerateRefreshToken.mockReturnValue('new-refresh-token');
  });

  describe('authenticate', () => {
    it('should set user in request when valid token is provided', async () => {
      await authMiddleware.authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockRequest.user).toEqual({ userId: mockUserId });
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with error when no authorization header is provided', async () => {
      mockRequest.headers = {};
      
      await authMiddleware.authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No authorization header provided',
          statusCode: 401
        })
      );
    });

    it('should call next with error when authorization header format is invalid', async () => {
      mockRequest.headers = { authorization: 'InvalidFormat token' };
      
      await authMiddleware.authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid authorization header format. Expected "Bearer <token>"',
          statusCode: 401
        })
      );
    });

    it('should call next with error when token is empty', async () => {
      mockRequest.headers = { authorization: 'Bearer ' };
      
      await authMiddleware.authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token not provided in authorization header',
          statusCode: 401
        })
      );
    });

    it('should call next with error when token has a invalid type for userID', async () => {
      const { mockVerifyToken } = require('../../services/tokenService');
      mockVerifyToken.mockReturnValue({
        userId: 1,
      });
      const verificationError = new StreamingServiceError('Invalid token', 401);

      await authMiddleware.authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining(verificationError));
    });

    it('should call next with an error when the role is bot and it tries to access an unauthorized path', async () => {
      const mockReqWithPath = {
        ...mockRequest,
        path: "Unauthorized Path",
      }
      const { mockVerifyToken } = require('../../services/tokenService');
      mockVerifyToken.mockReturnValue({
        userId: mockUserId,
        role: "bot"
      });
      const verificationError = new StreamingServiceError('Invalid token', 401);

      await authMiddleware.authenticate(mockReqWithPath as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining(verificationError));
    });

    it('should call next with error when token verification fails', async () => {
      const { mockVerifyToken } = require('../../services/tokenService');
      const verificationError = new StreamingServiceError('Invalid token', 401);
      mockVerifyToken.mockImplementation(() => {
        throw verificationError;
      });
      
      await authMiddleware.authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(verificationError);
    });
  });

  describe('refreshToken middleware', () => {
    it('should return new token and refresh token when valid refresh token is provided', async () => {
      await authMiddleware.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.json).toHaveBeenCalledWith({
        token: 'new-token',
        refreshToken: 'new-refresh-token'
      });
    });

    it('should call next with error when no refresh token is provided', async () => {
      mockRequest.body = {};
      
      await authMiddleware.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No refresh token provided',
          statusCode: 401
        })
      );
    });

    it('should call next with error when refresh token verification fails', async () => {
      const { mockVerifyRefreshToken } = require('../../services/tokenService');
      const verificationError = new StreamingServiceError('Invalid refresh token', 401);
      mockVerifyRefreshToken.mockImplementation(() => {
        throw verificationError;
      });
      
      await authMiddleware.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(verificationError);
    });
  });

  describe('private methods', () => {
    it('should extract token from a valid authorization header', () => {
      // Call the private method through the authenticate method
      const validHeader = 'Bearer valid-token';
      const extractedToken = (authMiddleware as any).extractTokenFromHeader(validHeader);
      
      expect(extractedToken).toBe('valid-token');
    });
  });
}); 
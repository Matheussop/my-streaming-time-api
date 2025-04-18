import { TokenService } from '../tokenService';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { StreamingServiceError } from '../../middleware/errorHandler';

jest.mock('jsonwebtoken');

describe('TokenService', () => {
  let tokenService: TokenService;
  const mockUserId = new Types.ObjectId();
  const mockToken = 'mock-token';
  const mockRefreshToken = 'mock-refresh-token';
  const mockDecodedToken = { userId: mockUserId };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    tokenService = TokenService.getInstance();
  });


  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = TokenService.getInstance();
      const instance2 = TokenService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid token', () => {
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = tokenService.generateToken(mockUserId);

      expect(result).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUserId },
        'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should use default secret if JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      let newTokenService: TokenService;
      
      jest.isolateModules(() => {
        const { TokenService: NewTokenService } = require('../tokenService');
        newTokenService = NewTokenService.getInstance();
      });

      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = newTokenService!.generateToken(mockUserId);

      expect(result).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUserId },
        'random-secret-key',
        { expiresIn: '1h' }
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);

      const result = tokenService.verifyToken(mockToken);

      expect(result).toEqual({ userId: mockUserId });
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret');
    });

    it('should throw error for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => tokenService.verifyToken('invalid-token'))
        .toThrow(new StreamingServiceError('Invalid or expired token', 401));
    });

    it('should use default secret if JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      let newTokenService: TokenService;
      
      jest.isolateModules(() => {
        const { TokenService: NewTokenService } = require('../tokenService');
        newTokenService = NewTokenService.getInstance();
      });

      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);

      const result = newTokenService!.verifyToken(mockToken);

      expect(result).toEqual({ userId: mockUserId });
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'random-secret-key');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      (jwt.sign as jest.Mock).mockReturnValue(mockRefreshToken);

      const result = tokenService.generateRefreshToken(mockUserId);

      expect(result).toBe(mockRefreshToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUserId },
        'test-refresh-secret',
        { expiresIn: '7d' }
      );
    });

    it('should use default secret if JWT_REFRESH_SECRET is not set', () => {
      delete process.env.JWT_REFRESH_SECRET;
      let newTokenService: TokenService;
      
      jest.isolateModules(() => {
        const { TokenService: NewTokenService } = require('../tokenService');
        newTokenService = NewTokenService.getInstance();
      });

      (jwt.sign as jest.Mock).mockReturnValue(mockRefreshToken);

      const result = newTokenService!.generateRefreshToken(mockUserId);

      expect(result).toBe(mockRefreshToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUserId },
        'random-refresh-secret-key',
        { expiresIn: '7d' }
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);

      const result = tokenService.verifyRefreshToken(mockRefreshToken);

      expect(result).toEqual({ userId: mockUserId });
      expect(jwt.verify).toHaveBeenCalledWith(mockRefreshToken, 'test-refresh-secret');
    });

    it('should throw error for invalid refresh token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => tokenService.verifyRefreshToken('invalid-refresh-token'))
        .toThrow(new StreamingServiceError('Invalid or expired refresh token', 401));
    });

    it('should use default secret if JWT_REFRESH_SECRET is not set', () => {
      delete process.env.JWT_REFRESH_SECRET;
      let newTokenService: TokenService;
      
      jest.isolateModules(() => {
        const { TokenService: NewTokenService } = require('../tokenService');
        newTokenService = NewTokenService.getInstance();
      });

      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);

      const result = newTokenService!.verifyRefreshToken(mockRefreshToken);

      expect(result).toEqual({ userId: mockUserId });
      expect(jwt.verify).toHaveBeenCalledWith(mockRefreshToken, 'random-refresh-secret-key');
    });
  });
}); 
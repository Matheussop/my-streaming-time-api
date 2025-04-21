import { NextFunction, Request, Response } from 'express';
import { AuthController } from '../authController';
import { AuthService } from '../../services/authService';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/__tests__/generateValidObjectId';
import { IUserLoginResponse, IUserResponse, IUserCreate } from '../../interfaces/user';

jest.mock('../../services/authService');

describe('AuthController', () => {
  let controller: AuthController;
  let mockService: jest.Mocked<AuthService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let validId: Types.ObjectId | string;
  let mockUser: IUserResponse;

  beforeEach(() => {
    validId = generateValidObjectId();
    mockUser = {
      _id: validId as Types.ObjectId,
      email: 'test@example.com',
      username: 'testuser',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockService = new AuthService({} as any) as jest.Mocked<AuthService>;
    controller = new AuthController(mockService);
    mockReq = {
      body: {},
      user: { userId: validId },
      method: 'POST',
      path: '/auth'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(() => mockRes),
      send: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('registerUser', () => {
    it('should register new user successfully', async () => {
      const newUser = mockUser;
      const userData: IUserCreate = {
        email: newUser.email,
        username: newUser.username,
        password: 'password123',
        active: true
      };
      mockReq.body = userData;
      mockService.registerUser.mockResolvedValue(newUser);

      await controller.registerUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.registerUser).toHaveBeenCalledWith(userData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'User created successfully', 
        user: newUser 
      });
    });
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: mockUser.email,
        password: 'password123'
      };
      const loginResponse: IUserLoginResponse = {
        token: 'jwt-token',
        refreshToken: 'refresh-token',
        user: mockUser
      };
      mockReq.body = loginData;
      mockService.loginUser.mockResolvedValue(loginResponse);

      await controller.loginUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.loginUser).toHaveBeenCalledWith(loginData.email, loginData.password);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Login successful', 
        ...loginResponse 
      });
    });
  });

  describe('validateUser', () => {
    it('should validate user successfully when userId exists', async () => {
      const validatedUser = mockUser;
      mockService.validateUser.mockResolvedValue(validatedUser);

      await controller.validateUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.validateUser).toHaveBeenCalledWith(validId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ user: validatedUser });
    });

    it('should handle error when userId is undefined', async () => {
      mockReq.user = undefined;
      const error = new TypeError('Cannot read properties of undefined (reading \'userId\')');
      mockService.validateUser.mockRejectedValue(error);

      await controller.validateUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockService.validateUser).not.toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
}); 
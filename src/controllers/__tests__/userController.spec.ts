import { NextFunction, Request, Response } from 'express';
import { UserController } from '../userController';
import { UserService } from '../../services/userService';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/test/generateValidObjectId';
import { IUserResponse } from '../../interfaces/user';
import { UserRepository } from '../../repositories/userRepository';

jest.mock('../../services/userService');
/**
 * Important to mock catchAsync so that the test is not impacted
 * by the promise that catchAsync returns
 */
jest.mock('../../util/catchAsync', () => ({
  catchAsync: (fn: Function) => fn
}));

describe('UserController', () => {
  let controller: UserController;
  let mockService: jest.Mocked<UserService>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let validId: Types.ObjectId;
  let mockUser: IUserResponse;

  beforeEach(() => {
    validId = new Types.ObjectId(generateValidObjectId());
    mockUser = {
      _id: validId,
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date()
    } as unknown as IUserResponse;

    mockUserRepository = {} as jest.Mocked<UserRepository>;
    mockService = new UserService(mockUserRepository) as jest.Mocked<UserService>;
    controller = new UserController(mockService);
    mockReq = {
      body: {},
      params: {},
      validatedIds: {},
      method: 'GET',
      path: '/users'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(() => mockRes),
      send: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('listUsers', () => {
    it('should return users with pagination', async () => {
      const page = 1;
      const limit = 10;
      const skip = 0;
      mockReq.body = { page, limit };

      mockService.getAllUsers.mockResolvedValue([mockUser]);

      await controller.listUsers(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getAllUsers).toHaveBeenCalledWith(skip, limit);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([mockUser]);
    });

    it('should use default pagination values when not provided', async () => {
      const defaultPage = 1;
      const defaultLimit = 10;
      const defaultSkip = 0;
      mockReq.body = {};

      mockService.getAllUsers.mockResolvedValue([mockUser]);

      await controller.listUsers(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getAllUsers).toHaveBeenCalledWith(defaultSkip, defaultLimit);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([mockUser]);
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const id = validId;
      mockReq.validatedIds = { id };

      mockService.getUserById.mockResolvedValue(mockUser);

      await controller.getUserById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getUserById).toHaveBeenCalledWith(id);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const id = validId;
      const updateData = {
        name: 'Updated User',
        email: 'updated@example.com'
      };
      mockReq.validatedIds = { id };
      mockReq.body = updateData;

      mockService.updateUser.mockResolvedValue(mockUser);

      await controller.updateUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.updateUser).toHaveBeenCalledWith(id, updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const id = validId;
      mockReq.validatedIds = { id };

      mockService.deleteUser.mockResolvedValue(mockUser);

      await controller.deleteUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.deleteUser).toHaveBeenCalledWith(id);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User deleted successfully', deletedUser: mockUser });
    });
  });
});

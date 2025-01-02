import { NextFunction, Request, Response } from 'express';
import { UserController } from '../userController';
import { UserService } from '../../services/userService';
import { IUserRepository } from '../../interfaces/repositories';
import { IUser } from '../../models/userModel';
import { StreamingServiceError } from '../../middleware/errorHandler';
import { generateValidObjectId } from '../../util/test/generateValidObjectId';

jest.mock('../../services/userService');

describe('UserController', () => {
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockUserRepository: IUserRepository;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockUserRepository = {} as jest.Mocked<IUserRepository>;
    mockUserService = new UserService(mockUserRepository) as jest.Mocked<UserService>;
    userController = new UserController(mockUserService);
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('getUserById', () => {
    it('should return 200 and the user if found', async () => {
      const userID = generateValidObjectId();
      const mockUser = { id: userID, name: 'John Doe', email: 'johnDoe@test.com' } as IUser;
      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockReq.params = { id: userID };

      await userController.getUserById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should return 404 if user ID is invalid', async () => {
      mockReq.params = { id: 'invalid-id' };

      await userController.getUserById(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(new StreamingServiceError('Invalid user ID format', 400));
    });
  });

  describe('registerUser', () => {
    it('should return 201 and the new user e message if created successfully', async () => {
      const userID = generateValidObjectId();
      const mockUser = { id: userID, name: 'John Doe', email: 'johnDoe@test.com' } as IUser;
      mockUserService.registerUser.mockResolvedValue(mockUser);
      mockReq.body = mockUser;

      await userController.registerUser(mockReq as Request, mockRes as Response, mockNext);

      const returnValueUser = { message: 'User created successfully', user: mockUser };
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(returnValueUser);
    });

    it('should return 400 if there is an empty body', async () => {
      mockReq.body = {};
      await userController.registerUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new StreamingServiceError('Request body is missing', 400));
    });
  });

  describe('loginUser', () => {
    it('should return 200 and the user if login is successful', async () => {
      const userID = generateValidObjectId();
      const mockUser = { id: userID, name: 'John Doe', email: '' } as IUser;
      mockUserService.loginUser.mockResolvedValue(mockUser);
      mockReq.body = mockUser;

      await userController.loginUser(mockReq as Request, mockRes as Response, mockNext);

      const returnValueUser = { message: 'Login successful', user: mockUser };
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(returnValueUser);
    });
  });

  describe('updateUser', () => {
    it('should return 200 and the updated user', async () => {
      const userID = generateValidObjectId();
      const mockUser = { id: userID, name: 'John Doe', email: '' } as IUser;
      mockUserService.updateUser.mockResolvedValue(mockUser);
      mockReq.params = { id: userID };
      mockReq.body = mockUser;

      await userController.updateUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('deleteUser', () => {
    it('should return 200 and the deleted user', async () => {
      const userID = generateValidObjectId();
      const mockUser = { id: userID, name: 'John Doe', email: '' } as IUser;
      mockUserService.deleteUser.mockResolvedValue(mockUser);
      mockReq.params = { id: userID };

      await userController.deleteUser(mockReq as Request, mockRes as Response, mockNext);

      const returnValueUser = { message: 'User deleted successfully', deletedUser: mockUser };
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(returnValueUser);
    });
  });

  describe('listUsers', () => {
    it('should return 200 and all users', async () => {
      const userID = generateValidObjectId();
      const mockUsers = [
        { id: generateValidObjectId(), name: 'John Doe', email: '' },
        { id: generateValidObjectId(), name: 'Jane Doe', email: '' },
      ] as IUser[];
      mockUserService.getAllUsers.mockResolvedValue(mockUsers);
      mockReq = {
        body: {},
        params: { id: userID },
        method: 'GET',
        path: '/movies',
      };
      await userController.listUsers(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
    });
  });
});

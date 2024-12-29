import express, { Request, Response, NextFunction, Express } from 'express';
import { UserController } from '../../controllers/userController';
import { UserService } from '../../services/userService';
import { UserRepository } from '../../repositories/userRepository';
import * as validateModule from '../../util/validate';
import request from 'supertest';

jest.mock('../../controllers/userController');
jest.mock('../../services/userService');
jest.mock('../../repositories/userRepository');

jest.mock('../../util/validate', () => ({
  validateRequest: jest.fn(),
}));

const mockRegisterUser = jest.fn();
const mockLoginUser = jest.fn();
const mockGetUserById = jest.fn();
const mockUpdateUser = jest.fn();
const mockDeleteUser = jest.fn();
const mockListUsers = jest.fn();

jest.mock('../../controllers/userController', () => {
  return {
    UserController: jest.fn().mockImplementation(() => ({
      registerUser: mockRegisterUser,
      loginUser: mockLoginUser,
      getUserById: mockGetUserById,
      updateUser: mockUpdateUser,
      deleteUser: mockDeleteUser,
      listUsers: mockListUsers
    }))
  };
});

import userRoutes from '../userRoutes';

describe('User Routes', () => {
  let app: Express;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let mockUserController: jest.Mocked<UserController>;
  let mockUserService: jest.Mocked<UserService>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/user', userRoutes);
  });

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
    } as Partial<Request>;
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;
    mockNext = jest.fn();

    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    mockUserService = new UserService(mockUserRepository) as jest.Mocked<UserService>;
    mockUserController = new UserController(mockUserService) as jest.Mocked<UserController>;
    
    jest.clearAllMocks();
    mockValidateRequest.mockImplementation((req, res, next) => next());
  });

  const mockValidateRequest = validateModule.validateRequest as jest.Mock;

  const findRoute = (path: string, method: string): any | undefined => {
    return userRoutes.stack.find(layer => {
      if (!layer.route) return false;
      return layer.route.path === path && layer.route.stack.some(handler => 
        handler.method === method
      );
    });
  };

  describe('POST /register', () => {
    const validUser = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    };

    it('should register a new user with valid data', async () => {
      mockReq.body = validUser;
      
      jest.spyOn(mockUserController, 'registerUser').mockImplementation((req, res) => {
        res.status(201).json({ message: 'User created successfully' });
      });

      const response = await request(app).post('/user/register').send(validUser);

      expect(response.status).toBe(201);
      expect(mockUserController.registerUser).toHaveBeenCalled();
    });
  });

  describe('POST /login', () => {
    const validCredentials = {
      email: 'john@example.com',
      password: 'password123'
    };

    it('should login user with valid credentials', async () => {
      mockReq.body = validCredentials;

      jest.spyOn(mockUserController, 'loginUser').mockImplementation((req, res) => {
        res.status(200).json({ message: 'User logged in successfully' });
      });

      const response = await request(app).post('/user/login').send(validCredentials);

      expect(response.status).toBe(200);
      expect(mockValidateRequest).toHaveBeenCalled();
      expect(mockUserController.loginUser).toHaveBeenCalled();
    });
  });

  describe('GET /users/:id', () => {
    it('should get user by valid ID', async () => {
      const userId = '123';
      const mockUser = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com'
      };

      jest.spyOn(mockUserController, 'getUserById').mockImplementation((req, res) => {
        res.status(200).json(mockUser);
      });

      const response = await request(app)
        .get(`/user/${userId}`);


      expect(response.status).toBe(200);
      expect(mockUserController.getUserById).toHaveBeenCalled();
      expect(response.body).toEqual(mockUser);
    });
  });

  describe('PUT /users/:id', () => {
    const userId = '123';
    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com'
    };

    it('should update user with valid data', async () => {
      jest.spyOn(mockUserController, 'updateUser').mockImplementation((req, res) => {
        res.status(200).json({ message: 'User updated successfully' });
      });

      const response = await request(app)
        .put(`/user/${userId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(mockUserController.updateUser).toHaveBeenCalled();
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user with valid ID', async () => {
      const userId = '123';
      mockReq.params = { id: userId };

      jest.spyOn(mockUserController, 'deleteUser').mockImplementation((req, res) => {
        res.status(200).json({ message: 'User deleted successfully' });
      });

      const response = await request(app)
        .delete(`/user/${userId}`);


      expect(response.status).toBe(200);
      expect(mockUserController.deleteUser).toHaveBeenCalled();
    });
  });

  describe('GET /users', () => {
    it('should list all users', async () => {
      const mockUsers = [
        { id: '1', name: 'User 1', email: 'user1@example.com' },
        { id: '2', name: 'User 2', email: 'user2@example.com' }
      ];

      jest.spyOn(mockUserController, 'listUsers').mockImplementation((req, res) => {
        res.status(200).json(mockUsers);
      });

      const response = await request(app)
        .get('/user');

      expect(response.status).toBe(200);
      expect(mockUserController.listUsers).toHaveBeenCalled();
      expect(response.body).toEqual(mockUsers);
    });
  });
});
import express, { Express } from 'express';
import request from 'supertest';
import { HttpStatus } from '../../constants/httpStatus';
import { Messages } from '../../constants/messages';
import * as validateModule from '../../util/validate';

const mockImplementations = {
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  listUsers: jest.fn(),
};

jest.mock('../../controllers/userController', () => ({
  UserController: jest.fn().mockImplementation(() => mockImplementations),
}));

jest.mock('../../services/userService');
jest.mock('../../repositories/userRepository');
jest.mock('../../util/validate', () => ({
  validateRequest: jest.fn(),
}));

import userRoutes from '../userRoutes';

describe('User Routes', () => {
  let app: Express;
  let mockValidateRequest: jest.Mock;

  const testData = {
    validUser: {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
    },
    validCredentials: {
      email: 'john@example.com',
      password: 'Password123!',
    },
    mockUsers: [
      { id: '1', name: 'User 1', email: 'user1@example.com' },
      { id: '2', name: 'User 2', email: 'user2@example.com' },
    ],
    testUserId: '123',
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/user', userRoutes);
    mockValidateRequest = validateModule.validateRequest as jest.Mock;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateRequest.mockImplementation((req, res, next) => next());
  });

  describe('POST /register', () => {
    it('should register a new user with valid data', async () => {
      mockImplementations.registerUser.mockImplementation((req, res) => {
        res.status(HttpStatus.CREATED).json({ message: Messages.USER_CREATED_SUCCESSFULLY });
      });

      const response = await request(app).post('/user/register').send(testData.validUser);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(mockImplementations.registerUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /login', () => {
    it('should login user with valid credentials', async () => {
      mockImplementations.loginUser.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json({ message: Messages.AUTHENTICATION_SUCCESS });
      });

      const response = await request(app).post('/user/login').send(testData.validCredentials);

      expect(response.status).toBe(HttpStatus.OK);
      expect(mockValidateRequest).toHaveBeenCalled();
      expect(mockImplementations.loginUser).toHaveBeenCalled();
    });
  });

  describe('GET /users/:id', () => {
    it('should get user by valid ID', async () => {
      mockImplementations.getUserById.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json(testData.validUser);
      });

      const response = await request(app).get(`/user/${testData.testUserId}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(mockImplementations.getUserById).toHaveBeenCalled();
      expect(response.body).toEqual(testData.validUser);
    });
  });

  describe('PUT /users/:id', () => {
    const userId = '123';
    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    it('should update user with valid data', async () => {
      mockImplementations.updateUser.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json({ message: Messages.USER_UPDATED_SUCCESSFULLY });
      });

      const response = await request(app).put(`/user/${testData.validUser}`).send(updateData);

      expect(response.status).toBe(HttpStatus.OK);
      expect(mockImplementations.updateUser).toHaveBeenCalled();
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user with valid ID', async () => {
      mockImplementations.deleteUser.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json({ message: Messages.USER_DELETED_SUCCESSFULLY });
      });

      const response = await request(app).delete(`/user/${testData.testUserId}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(mockImplementations.deleteUser).toHaveBeenCalled();
    });
  });

  describe('GET /users', () => {
    it('should list all users', async () => {
      mockImplementations.listUsers.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json(testData.mockUsers);
      });

      const response = await request(app).get('/user');

      expect(response.status).toBe(HttpStatus.OK);
      expect(mockImplementations.listUsers).toHaveBeenCalled();
      expect(response.body).toEqual(testData.mockUsers);
    });
  });
});

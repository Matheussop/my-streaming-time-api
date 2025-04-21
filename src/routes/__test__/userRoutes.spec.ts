import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../constants/httpStatus';
import { Messages } from '../../constants/messages';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/test/generateValidObjectId';

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

jest.mock('../../middleware/validationMiddleware', () => ({
  validate: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

jest.mock('../../middleware/objectIdValidationMiddleware', () => ({
  validateObjectId: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => {
    req.validatedIds = req.validatedIds || {};
    const id = req.params.id || '507f1f77bcf86cd799439011';
    req.validatedIds.id = new Types.ObjectId(id);
    next();
  }),
}));

jest.mock('../../services/userService', () => ({
  UserService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../repositories/userRepository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({})),
}));

import router from '../userRoutes';

describe('User Routes', () => {
  let app: express.Application;
  let mockId: string | Types.ObjectId;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/users', router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockId = generateValidObjectId();
  });

  describe('GET /:id', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        _id: mockId.toString(),
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user'
      };

      mockImplementations.getUserById.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockUser);
      });

      const response = await request(app)
        .get(`/users/${mockId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockUser);
    });
  });

  describe('PUT /:id', () => {
    it('should update a user', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      mockImplementations.updateUser.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ 
          _id: mockId.toString(), 
          ...updateData,
          role: 'user'
        });
      });

      const response = await request(app)
        .put(`/users/${mockId}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ 
        _id: mockId.toString(), 
        ...updateData,
        role: 'user'
      });
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a user', async () => {
      mockImplementations.deleteUser.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ message: Messages.USER_DELETED_SUCCESSFULLY });
      });

      const response = await request(app)
        .delete(`/users/${mockId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ message: Messages.USER_DELETED_SUCCESSFULLY });
    });
  });

  describe('GET /', () => {
    it('should return list of users with pagination', async () => {
      const mockUsers = {
        data: [
          { _id: mockId.toString(), name: 'User 1', email: 'user1@example.com' },
          { _id: generateValidObjectId().toString(), name: 'User 2', email: 'user2@example.com' },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      mockImplementations.listUsers.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockUsers);
      });

      const response = await request(app)
        .get('/users')
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockUsers);
    });
  });
});

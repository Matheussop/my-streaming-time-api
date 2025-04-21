import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../constants/httpStatus';
import { Messages } from '../../constants/messages';
import { generateValidObjectId } from '../../util/__tests__/generateValidObjectId';
import { Types } from 'mongoose';

const mockImplementations = {
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  validateUser: jest.fn(),
};

jest.mock('../../controllers/authController', () => ({
  AuthController: jest.fn().mockImplementation(() => mockImplementations),
}));

const mockAuthMiddleware = {
  authenticate: jest.fn(),
  refreshToken: jest.fn(),
};

jest.mock('../../middleware/authMiddleware', () => ({
  AuthMiddleware: jest.fn().mockImplementation(() => mockAuthMiddleware),
}));

jest.mock('../../middleware/validationMiddleware', () => ({
  validate: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

import router from '../authRoutes';

describe('Auth Routes', () => {
  let app: express.Application;
  let mockId: string | Types.ObjectId;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockId = generateValidObjectId();
    mockAuthMiddleware.authenticate.mockImplementation((req: Request, res: Response, next: NextFunction) => next());
  });

  describe('POST /register', () => {
    it('should register a new user', async () => {
      const newUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password1!',
        active: true,
      };

      const userResponse = {
        _id: mockId,
        username: 'testuser',
        email: 'test@example.com',
        active: true,
      };

      mockImplementations.registerUser.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.CREATED).json({ 
          message: Messages.USER_CREATED_SUCCESSFULLY, 
          user: userResponse 
        });
      });

      const response = await request(app)
        .post('/auth/register')
        .send(newUser)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        message: Messages.USER_CREATED_SUCCESSFULLY,
        user: userResponse
      });
    });
  });

  describe('POST /login', () => {
    it('should login a user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password1!'
      };

      const loginResponse = {
        message: 'Login successful',
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        user: {
          _id: mockId,
          username: 'testuser',
          email: 'test@example.com',
          active: true,
        }
      };

      mockImplementations.loginUser.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(loginResponse);
      });

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(loginResponse);
    });
  });

  describe('POST /refresh-token', () => {
    it('should refresh a user token', async () => {
      const refreshData = {
        refreshToken: 'old-refresh-token'
      };

      const tokenResponse = {
        token: 'new-jwt-token',
        refreshToken: 'new-refresh-token'
      };

      mockAuthMiddleware.refreshToken.mockImplementation((req: Request, res: Response, next: NextFunction) => {
        res.status(HttpStatus.OK).json(tokenResponse);
      });

      const response = await request(app)
        .post('/auth/refresh-token')
        .send(refreshData)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(tokenResponse);
    });
  });

  describe('GET /validate', () => {
    it('should validate an authenticated user', async () => {
      const userResponse = {
        user: {
          _id: mockId,
          username: 'testuser',
          email: 'test@example.com',
          active: true,
        }
      };

      mockImplementations.validateUser.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(userResponse);
      });

      const response = await request(app)
        .get('/auth/validate')
        .set('Authorization', 'Bearer valid-token')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(userResponse);
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalled();
    });
  });
}); 
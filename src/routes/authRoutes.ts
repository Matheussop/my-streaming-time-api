import { Router } from 'express';
import { UserRepository } from '../repositories/userRepository';
import { UserCreateSchema, UserLoginSchema } from '../validators/userSchema';
import { validate } from '../middleware/validationMiddleware';
import { AuthService } from '../services/authService';
import { AuthMiddleware } from '../middleware/authMiddleware';
import { AuthController } from '../controllers/authController';

const authRoutes: Router = Router();
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);
const authMiddleware = new AuthMiddleware(authService);

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and authorization
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 */
authRoutes.post(
  '/register',
  validate(UserCreateSchema),
  authController.registerUser,
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid credentials
 */
authRoutes.post(
  '/login',
  validate(UserLoginSchema),
  authController.loginUser,
);


/**
 * @swagger
 * /auth/validate:
 *   get:
 *     summary: Validate a user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User validated successfully
 *       401:
 *         description: Invalid credentials
 */
authRoutes.get('/validate', authMiddleware.authenticate, authController.validateUser);

export default authRoutes;

import { UserService } from './../services/userService';
import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { UserRepository } from '../repositories/userRepository';
import { UserUpdateSchema } from '../validators/userSchema';
import { validate } from '../middleware/validationMiddleware';
import { validateObjectId } from '../middleware/objectIdValidationMiddleware';
import { paginationSchema } from '../validators';


const userRoutes: Router = Router();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and login
 */

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Retrieve a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A user object
 *       404:
 *         description: User not found
 */
userRoutes.get('/:id', 
  validateObjectId(),
  userController.getUserById);

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
userRoutes.put(
  '/:id',
  validateObjectId(),
  validate(UserUpdateSchema),
  userController.updateUser,
);

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
userRoutes.delete('/:id', 
  validateObjectId(),
  userController.deleteUser);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Retrieve a list of users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: A list of users
 */
userRoutes.get('/', 
  validate(paginationSchema),
  userController.listUsers);

export default userRoutes;

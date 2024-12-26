import { Request, Response } from 'express';
import { catchAsync } from '../util/catchAsync';
import logger from '../config/logger';
import { StreamingServiceError } from '../middleware/errorHandler';
import { IUserService } from '../interfaces/services';

export class UserController {
  constructor(private userService: IUserService) {}

  registerUser = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Registering new user',
      email: req.body.email,
      method: req.method,
      path: req.path,
    });

    if (!req.body || Object.keys(req.body).length === 0) {
      logger.warn({
        message: 'Request body is missing',
        method: req.method,
        path: req.path,
      });
      throw new StreamingServiceError('Request body is missing', 400);
    }

    const user = await this.userService.registerUser(req.body);
    res.status(201).json({ message: 'User created successfully', user });
  });

  loginUser = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'User login attempt',
      email: req.body.email,
      method: req.method,
      path: req.path,
    });

    const user = await this.userService.loginUser(req.body.email, req.body.password);
    res.status(200).json({ message: 'Login successful', user });
  });

  getUserById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({
      message: 'Fetching user by ID',
      userId: req.params.id,
      method: req.method,
      path: req.path,
    });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new StreamingServiceError('Invalid user ID format', 400);
    }

    const user = await this.userService.getUserById(req.params.id);
    res.status(200).json(user);
  });

  updateUser = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Updating user',
      userId: req.params.id,
      method: req.method,
      path: req.path,
    });

    const user = await this.userService.updateUser(req.params.id, req.body);
    res.status(200).json(user);
  });

  deleteUser = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Deleting user',
      userId: req.params.id,
      method: req.method,
      path: req.path,
    });

    const deletedUser = await this.userService.deleteUser(req.params.id);
    res.status(200).json({ message: 'User deleted successfully', deletedUser });
  });

  listUsers = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'List users',
      userId: req.params.id,
      method: req.method,
      path: req.path,
    });

    const users = await this.userService.getAllUsers();
    res.status(200).json(users);
  });
}

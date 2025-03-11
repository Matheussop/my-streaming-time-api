import { Request, Response } from 'express';
import { catchAsync } from '../util/catchAsync';
import logger from '../config/logger';
import { StreamingServiceError } from '../middleware/errorHandler';
import { UserService } from '../services/userService';

export class UserController {
  constructor(private userService: UserService) {}

  registerUser = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Registering new user',
      email: req.body.email,
      username: req.body.username,
      method: req.method,
      path: req.path,
    });

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
    const id = req.validatedIds.id;

    logger.info({
      message: 'Fetching user by ID',
      userId: id,
      method: req.method,
      path: req.path,
    });

    const user = await this.userService.getUserById(id);
    res.status(200).json(user);
  });

  updateUser = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;

    logger.info({
      message: 'Updating user',
      userId: id,
      method: req.method,
      path: req.path,
    });

    const user = await this.userService.updateUser(id, req.body);
    res.status(200).json(user);
  });

  deleteUser = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;

    logger.info({
      message: 'Deleting user',
      userId: id,
      method: req.method,
      path: req.path,
    });

    const deletedUser = await this.userService.deleteUser(id);
    res.status(200).json({ message: 'User deleted successfully', deletedUser });
  });

  listUsers = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.body;
    const skip = (Number(page) - 1) * Number(limit);

    logger.info({
      message: 'List users',
      userId: req.params.id,
      method: req.method,
      path: req.path,
    });

    const users = await this.userService.getAllUsers(skip, limit);
    res.status(200).json(users);
  });
}

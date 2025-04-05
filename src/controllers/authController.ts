import { Request, Response } from 'express';
import { catchAsync } from '../util/catchAsync';
import logger from '../config/logger';
import { AuthService } from '../services/authService';

export class AuthController {
  constructor(private authService: AuthService) {}

  registerUser = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Registering new user',
      email: req.body.email,
      username: req.body.username,
      method: req.method,
      path: req.path,
    });

    const user = await this.authService.registerUser(req.body);
    res.status(201).json({ message: 'User created successfully', user });
  });

  loginUser = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'User login attempt',
      email: req.body.email,
      method: req.method,
      path: req.path,
    });

    const loginResponse = await this.authService.loginUser(req.body.email, req.body.password);
    res.status(200).json({ message: 'Login successful', ...loginResponse });
  });

  validateUser = catchAsync(async (req: Request, res: Response) => {

    logger.info({
      message: 'Validating user',
      token: req.user?.userId,
      method: req.method,
      path: req.path,
    });

    const userId = req.user?.userId as string;
    const user = await this.authService.validateUser(userId);
    res.status(200).json({user});
  });

}
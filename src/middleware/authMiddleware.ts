import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { StreamingServiceError } from './errorHandler';

import { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: Types.ObjectId | string;
      };
    }
  }
} 

export class AuthMiddleware {
  private authService: AuthService;
  private readonly BEARER_PREFIX = 'Bearer ';

  constructor() {
    this.authService = new AuthService();
  }

  private extractTokenFromHeader(authHeader: string): string {
    if (!authHeader.startsWith(this.BEARER_PREFIX)) {
      throw new StreamingServiceError('Invalid authorization header format. Expected "Bearer <token>"', 401);
    }

    const token = authHeader.slice(this.BEARER_PREFIX.length).trim();
    
    if (!token) {
      throw new StreamingServiceError('Token not provided in authorization header', 401);
    }

    return token;
  }

  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new StreamingServiceError('No authorization header provided', 401);
      }
      
      const token = this.extractTokenFromHeader(authHeader);
      const { userId } = this.authService.verifyToken(token);
      req.user = { userId: userId as Types.ObjectId | string };
      next();
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new StreamingServiceError('No refresh token provided', 401);
      }

      const { userId } = this.authService.verifyRefreshToken(refreshToken);
      const newToken = this.authService.generateToken(userId);
      const newRefreshToken = this.authService.generateRefreshToken(userId);

      res.json({
        token: newToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      next(error);
    }
  };
} 
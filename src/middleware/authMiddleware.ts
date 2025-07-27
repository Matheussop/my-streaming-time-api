import { Request, Response, NextFunction } from 'express';
import { StreamingServiceError } from './errorHandler';
import { Types } from 'mongoose';
import { TokenService } from '../services/tokenService';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: Types.ObjectId | string;
      };
    }
  }
} 

const botWhitelist = [
  '/streamingTypes/change-cover',
];

export class AuthMiddleware {
  private readonly BEARER_PREFIX = 'Bearer ';
  private tokenService: TokenService;

  constructor() {
    this.tokenService = TokenService.getInstance();
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
      const { userId, role } = this.tokenService.verifyToken(token);

      if (!userId || typeof userId !== 'string') {
        throw new StreamingServiceError('Invalid token', 401);
      }

      if(role && role === 'bot'){
        const requestPath = req.path;

        const isAllowed = botWhitelist.some((allowedPath) => requestPath.startsWith(allowedPath));
        if (!isAllowed) {
          throw new StreamingServiceError('Bot is not allowed to access this endpoint', 401);
        }
      }

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

      const { userId } = this.tokenService.verifyRefreshToken(refreshToken);
      const newToken = this.tokenService.generateToken(userId);
      const newRefreshToken = this.tokenService.generateRefreshToken(userId);

      res.json({
        token: newToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      next(error);
    }
  };
} 
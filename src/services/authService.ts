import jwt, { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { IAuthService, ITokenPayload } from '../interfaces/auth';
import { StreamingServiceError } from '../middleware/errorHandler';

export class AuthService implements IAuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly TOKEN_EXPIRATION: string;
  private readonly REFRESH_TOKEN_EXPIRATION: string;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'random-secret-key';
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'random-refresh-secret-key';
    this.TOKEN_EXPIRATION = '1h';
    this.REFRESH_TOKEN_EXPIRATION = '7d';
  }

  generateToken(userId: Types.ObjectId ): string {
    const payload: ITokenPayload = { userId };
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.TOKEN_EXPIRATION } as SignOptions);
  }

  verifyToken(token: string): { userId: Types.ObjectId } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as ITokenPayload;
      return { userId: decoded.userId };
    } catch (error) {
      throw new StreamingServiceError('Invalid or expired token', 401);
    }
  }

  generateRefreshToken(userId: Types.ObjectId): string {
    const payload: ITokenPayload = { userId };
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, { expiresIn: this.REFRESH_TOKEN_EXPIRATION } as SignOptions);
  }

  verifyRefreshToken(token: string): { userId: Types.ObjectId } {
    try {
      const decoded = jwt.verify(token, this.JWT_REFRESH_SECRET) as ITokenPayload;
      return { userId: decoded.userId };
    } catch (error) {
      throw new StreamingServiceError('Invalid or expired refresh token', 401);
    }
  }
} 
import { Types } from 'mongoose';

export interface IAuthService {
  generateToken(userId: Types.ObjectId): string;
  verifyToken(token: string): { userId: Types.ObjectId };
  generateRefreshToken(userId: Types.ObjectId): string;
  verifyRefreshToken(token: string): { userId: Types.ObjectId };
}

export interface ITokenPayload {
  userId: Types.ObjectId;
  iat?: number;
  exp?: number;
} 
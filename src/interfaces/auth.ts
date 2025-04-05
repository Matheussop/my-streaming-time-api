import { Types } from 'mongoose';
import { IUserResponse } from './user';
import { IUserLoginResponse } from './user';
import { IUserCreate } from './user';

export interface IAuthService {
  generateToken(userId: Types.ObjectId): string;
  verifyToken(token: string): { userId: Types.ObjectId };
  generateRefreshToken(userId: Types.ObjectId): string;
  verifyRefreshToken(token: string): { userId: Types.ObjectId };
  loginUser(email: string, password: string): Promise<IUserLoginResponse>;
  validateUser(userId: string | Types.ObjectId): Promise<IUserResponse>;
  registerUser(userData: IUserCreate): Promise<IUserResponse>;
}

export interface ITokenPayload {
  userId: Types.ObjectId;
  iat?: number;
  exp?: number;
} 
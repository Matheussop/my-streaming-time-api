import { Types } from 'mongoose';
import { IUserResponse } from './user';
import { IUserLoginResponse } from './user';
import { IUserCreate } from './user';

export interface IAuthService {
  loginUser(email: string, password: string): Promise<IUserLoginResponse>;
  validateUser(userId: string | Types.ObjectId): Promise<IUserResponse>;
  registerUser(userData: IUserCreate): Promise<IUserResponse>;
}

export interface ITokenPayload {
  userId: Types.ObjectId;
  userRole?: string;
  iat?: number;
  exp?: number;
} 
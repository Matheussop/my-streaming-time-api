import jwt, { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { IAuthService, ITokenPayload } from '../interfaces/auth';
import { StreamingServiceError } from '../middleware/errorHandler';
import { IUserCreate, IUserLoginResponse, IUserResponse } from '../interfaces/user';
import { UserRepository } from '../repositories/userRepository';
import bcrypt from 'bcrypt';

export class AuthService implements IAuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly TOKEN_EXPIRATION: string;
  private readonly REFRESH_TOKEN_EXPIRATION: string;

  constructor(private userRepository: UserRepository) {
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

  async loginUser(email: string, password: string): Promise<IUserLoginResponse> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new StreamingServiceError('Invalid credentials', 401);
    }

    const isPasswordValid = await this.userRepository.checkPassword(user._id, password);
    if (!isPasswordValid) {
      throw new StreamingServiceError('Invalid credentials', 401);
    }

    const token = this.generateToken(user._id as Types.ObjectId);
    const refreshToken = this.generateRefreshToken(user._id as Types.ObjectId);

    return {
      user,
      token,
      refreshToken
    };
  }

  async validateUser(userId: string | Types.ObjectId): Promise<IUserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new StreamingServiceError('User not found', 404);
    }
    return user;
  }

  async registerUser(userData: IUserCreate): Promise<IUserResponse> {
    await this.checkDuplicateEmail(userData.email);

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = await this.userRepository.create({
      ...userData,
      password: hashedPassword
    });
    return newUser;
  }

  private async checkDuplicateEmail(email: string, userId?: string | Types.ObjectId) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser && (!userId || existingUser._id.toString() !== userId.toString())) {
      throw new StreamingServiceError('Email already in use', 400);
    }
  }
} 
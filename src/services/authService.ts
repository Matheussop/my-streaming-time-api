import { Types } from 'mongoose';
import { IAuthService } from '../interfaces/auth';
import { StreamingServiceError } from '../middleware/errorHandler';
import { IUserCreate, IUserLoginResponse, IUserResponse } from '../interfaces/user';
import { UserRepository } from '../repositories/userRepository';
import { TokenService } from '../services/tokenService';
import bcrypt from 'bcrypt';

export class AuthService implements IAuthService {
  private tokenService: TokenService;

  constructor(private userRepository: UserRepository) {
    this.tokenService = TokenService.getInstance();
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

    const token = this.tokenService.generateToken(user._id as Types.ObjectId);
    const refreshToken = this.tokenService.generateRefreshToken(user._id as Types.ObjectId);

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
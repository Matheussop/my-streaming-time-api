import { Types } from 'mongoose';
import { IUserService } from '../interfaces/services';
import { IUserCreate, IUserLoginResponse, IUserResponse } from '../interfaces/user';
import { StreamingServiceError } from '../middleware/errorHandler';
import { UserRepository } from '../repositories/userRepository';
import bcrypt from 'bcrypt';
import { AuthService } from './authService';
export class UserService implements IUserService {
  constructor(private userRepository: UserRepository, private authService: AuthService) {}

  async getAllUsers(skip: number, limit: number) {
    return this.userRepository.findAll(skip, limit);
  }

  async getUserById(id: string | Types.ObjectId) {
    const user = await this.userRepository.findById(id);
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

  async loginUser(email: string, password: string): Promise<IUserLoginResponse> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new StreamingServiceError('Invalid credentials', 401);
    }

    const isPasswordValid = await this.userRepository.checkPassword(user._id, password);
    if (!isPasswordValid) {
      throw new StreamingServiceError('Invalid credentials', 401);
    }

    const token = this.authService.generateToken(user._id as Types.ObjectId);
    const refreshToken = this.authService.generateRefreshToken(user._id as Types.ObjectId);

    return {
      user,
      token,
      refreshToken
    };
  }

  async updateUser(id: string | Types.ObjectId, updateData: any) {
    if (updateData.email) {
      await this.checkDuplicateEmail(updateData.email, id);
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10); // TODO: Implement bcrypt
    }

    const updatedUser = await this.userRepository.update(id, updateData);
    if (!updatedUser) {
      throw new StreamingServiceError('User not found', 404);
    }

    return updatedUser;
  }

  async changePassword(id: string | Types.ObjectId, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10); // TODO: Implement bcrypt
    return this.userRepository.update(id, { password: hashedPassword });
  }

  async deleteUser(id: string | Types.ObjectId) {
    const user = await this.userRepository.delete(id);
    if (!user) {
      throw new StreamingServiceError('User not found', 404);
    }
    return user;
  }

  private async checkDuplicateEmail(email: string, userId?: string | Types.ObjectId) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser && (!userId || existingUser._id.toString() !== userId.toString())) {
      throw new StreamingServiceError('Email already in use', 400);
    }
  }
}

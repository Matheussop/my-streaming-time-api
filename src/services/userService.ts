import { Types } from 'mongoose';
import { IUserService } from '../interfaces/services';
import { StreamingServiceError } from '../middleware/errorHandler';
import { UserRepository } from '../repositories/userRepository';
import bcrypt from 'bcrypt';
export class UserService implements IUserService {
  constructor(private userRepository: UserRepository) {}

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

  async updateUser(id: string | Types.ObjectId, updateData: any) {
    if (updateData.email) {
      await this.checkDuplicateEmail(updateData.email, id);
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedUser = await this.userRepository.update(id, updateData);
    if (!updatedUser) {
      throw new StreamingServiceError('User not found', 404);
    }

    return updatedUser;
  }

  async changePassword(id: string | Types.ObjectId, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
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

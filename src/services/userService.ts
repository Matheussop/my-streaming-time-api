import { IUserRepository } from '../interfaces/repositories';
import { StreamingServiceError } from '../middleware/errorHandler';

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  async getAllUsers() {
    return this.userRepository.findAll();
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new StreamingServiceError('User not found', 404);
    }
    return user;
  }

  async registerUser(userData: any) {
    await this.validateUserData(userData);
    await this.checkDuplicateEmail(userData.email);

    // const hashedPassword = await bcrypt.hash(userData.password, 10); // TODO: Implement bcrypt

    const newUser = await this.userRepository.create({
      ...userData,
      // password: hashedPassword
    });

    const { password, ...userWithoutPassword } = newUser.toObject();
    return userWithoutPassword;
  }

  async loginUser(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new StreamingServiceError('Invalid credentials', 401);
    }

    // const isPasswordValid = await bcrypt.compare(password, user.password); // TODO: Implement bcrypt
    // if (!isPasswordValid) {
    //   throw new StreamingServiceError('Invalid credentials', 401);
    // }

    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async updateUser(id: string, updateData: any) {
    if (updateData.email) {
      await this.checkDuplicateEmail(updateData.email, id);
    }

    // if (updateData.password) {
    //   updateData.password = await bcrypt.hash(updateData.password, 10); // TODO: Implement bcrypt
    // }

    const updatedUser = await this.userRepository.update(id, updateData);
    if (!updatedUser) {
      throw new StreamingServiceError('User not found', 404);
    }

    const { password, ...userWithoutPassword } = updatedUser.toObject();
    return userWithoutPassword;
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.delete(id);
    if (!user) {
      throw new StreamingServiceError('User not found', 404);
    }
    return { message: 'User deleted successfully' };
  }

  private async validateUserData(data: any) {
    if (!this.isValidEmail(data.email)) {
      throw new StreamingServiceError('Invalid email format', 400);
    }

    if (data.password.length < 6) {
      throw new StreamingServiceError('Password must be at least 6 characters long', 400);
    }
  }

  private async checkDuplicateEmail(email: string, userId?: string) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser && (!userId || existingUser._id.toString() !== userId)) {
      throw new StreamingServiceError('Email already in use', 400);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

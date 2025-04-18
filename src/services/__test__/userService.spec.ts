import { Types } from 'mongoose';
import { IUserResponse } from '../../interfaces/user';
import { StreamingServiceError } from '../../middleware/errorHandler';
import { UserRepository } from '../../repositories/userRepository';
import { UserService } from '../userService';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password')
}));

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  const mockUser: Partial<IUserResponse> = {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    username: 'testuser',
    active: true,
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20')
  };

  beforeEach(() => {
    mockUserRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByEmail: jest.fn(),
      checkPassword: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    userService = new UserService(mockUserRepository);
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [mockUser];
      mockUserRepository.findAll.mockResolvedValue(mockUsers as IUserResponse[]);

      const result = await userService.getAllUsers(0, 10);

      expect(mockUserRepository.findAll).toHaveBeenCalledWith(0, 10);
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUserById', () => {
    it('should return a user if found', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser as IUserResponse);

      const result = await userService.getUserById(mockUser._id as Types.ObjectId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById(mockUser._id as Types.ObjectId))
        .rejects.toThrow(new StreamingServiceError('User not found', 404));
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      const updateData = { email: 'updated@example.com' };
      const updatedUser = { ...mockUser, email: 'updated@example.com' };
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(updatedUser as IUserResponse);

      const result = await userService.updateUser(mockUser._id as Types.ObjectId, updateData);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(updateData.email);
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser._id, updateData);
      expect(result).toEqual(updatedUser);
    });

    it('should throw an error if email is already in use', async () => {
      const updateData = { email: 'existing@example.com' };
      const existingUser = { ...mockUser, _id: new Types.ObjectId() };
      
      mockUserRepository.findByEmail.mockResolvedValue(existingUser as IUserResponse);

      await expect(userService.updateUser(mockUser._id as Types.ObjectId, updateData))
        .rejects.toThrow(new StreamingServiceError('Email already in use', 400));
    });

    it('should throw an error if user is not found', async () => {
      const updateData = { email: 'updated@example.com' };
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(null);

      await expect(userService.updateUser(mockUser._id as Types.ObjectId, updateData))
        .rejects.toThrow(new StreamingServiceError('User not found', 404));
    });

    it('should hash password if provided in update data', async () => {
      const updateData = { password: 'newpassword' };
      const updatedUser = { ...mockUser };
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(updatedUser as IUserResponse);

      await userService.updateUser(mockUser._id as Types.ObjectId, updateData);

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockUser._id,
        { password: 'hashed-password' }
      );
    });
  });

  describe('changePassword', () => {
    it('should change user password successfully', async () => {
      const newPassword = 'newpassword';
      const updatedUser = { ...mockUser };
      
      mockUserRepository.update.mockResolvedValue(updatedUser as IUserResponse);

      const result = await userService.changePassword(mockUser._id as Types.ObjectId, newPassword);

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockUser._id,
        { password: 'hashed-password' }
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      mockUserRepository.delete.mockResolvedValue(mockUser as IUserResponse);

      const result = await userService.deleteUser(mockUser._id as Types.ObjectId);

      expect(mockUserRepository.delete).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if user is not found', async () => {
      mockUserRepository.delete.mockResolvedValue(null);

      await expect(userService.deleteUser(mockUser._id as Types.ObjectId))
        .rejects.toThrow(new StreamingServiceError('User not found', 404));
    });
  });
});

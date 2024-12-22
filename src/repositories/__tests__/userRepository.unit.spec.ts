import { UserRepository } from '../userRepository';
import User from '../../models/userModel';
import mongoose from 'mongoose';

jest.mock('../../models/userModel');

describe('UserRepository Unit Tests', () => {
  let userRepository: UserRepository;
  const mockUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test User',
    email: 'test@example.com',
    save: jest.fn()
  };

  const mockSaveUser = jest.fn().mockResolvedValue(mockUser);
  (User as unknown as jest.Mock).mockImplementation(() => ({
    save: mockSaveUser
  }));
  
  beforeEach(() => {
    userRepository = new UserRepository();
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      const mockUsers = [
        { 
          _id: new mongoose.Types.ObjectId(),
          name: 'Test User',
          email: 'test@example.com',
        },
        { 
          _id: new mongoose.Types.ObjectId(),
          name: 'Another User',
          email: 'another@example.com',
        }
      ];

      const findSpy = jest.spyOn(User, 'find').mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUsers)
          })
        })
      } as any);

      const result = await userRepository.findAll();

      expect(findSpy).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      result.forEach(user => {
        expect(user.password).toBeUndefined();
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
      });
    });

    it('should handle pagination correctly', async () => {
      const page = 2;
      const limit = 10;
      const skipValue = (page - 1) * limit;

      const findSpy = jest.spyOn(User, 'find').mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue([])
          })
        })
      } as any);

      await userRepository.findAll(skipValue, limit);

      expect(findSpy).toHaveBeenCalled();
      const skipSpy = findSpy.mock.results[0].value.skip;
      expect(skipSpy).toHaveBeenCalledWith(skipValue);
      expect(skipSpy().limit).toHaveBeenCalledWith(limit);
    });
  });

  describe('findById', () => {
    it('should find and return user without password', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockUser = {
        _id: userId,
        name: 'Test User',
        email: 'test@example.com',
      };

      const findByIdSpy = jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      } as any);

      const result = await userRepository.findById(userId);

      expect(findByIdSpy).toHaveBeenCalledWith(userId);
      expect(result).toBeDefined();
      expect(result?.password).toBeUndefined();
      expect(result?.name).toBe(mockUser.name);
    });

    it('should return null for non-existent user', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const findByIdSpy = jest.spyOn(User, 'findById').mockReturnValue  ({
        select: jest.fn().mockResolvedValue(null)
      } as any);

      const result = await userRepository.findById(userId);

      expect(findByIdSpy).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'newpass123'
      };

      mockSaveUser.mockResolvedValue({
        ...userData,
        _id: new mongoose.Types.ObjectId()
      });

      const result = await userRepository.create(userData);
      
      expect(User).toHaveBeenCalledWith(userData); 
      expect(mockSaveUser).toHaveBeenCalled();
      
      expect(result).toHaveProperty('_id');
      expect(result.name).toBe(userData.name);
      expect(result.email).toBe(userData.email);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };
      const mockUpdatedUser = {
        _id: userId,
        ...updateData
      };

      const findByIdAndUpdateSpy = jest.spyOn(User, 'findByIdAndUpdate')
        .mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUpdatedUser)
        } as any);

      const result = await userRepository.update(userId, updateData);

      expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(
        userId,
        { $set: updateData },
        {
          new: true,
          runValidators: true,
        }
      );
      expect(result).toBeDefined();
      expect(result?.name).toBe(updateData.name);
      expect(result?.email).toBe(updateData.email);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockDeletedUser = {
        _id: userId,
        name: 'Deleted User',
        email: 'deleted@example.com'
      };

      const findByIdAndDeleteSpy = jest.spyOn(User, 'findByIdAndDelete')
        .mockResolvedValue(mockDeletedUser);

      const result = await userRepository.delete(userId);

      expect(findByIdAndDeleteSpy).toHaveBeenCalledWith(userId);
      expect(result).toBeDefined();
      expect(result?._id.toString()).toBe(userId);
    });

    it('should return null when deleting non-existent user', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const findByIdAndDeleteSpy = jest.spyOn(User, 'findByIdAndDelete')
        .mockResolvedValue(null);

      const result = await userRepository.delete(userId);

      expect(findByIdAndDeleteSpy).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });
  });
});

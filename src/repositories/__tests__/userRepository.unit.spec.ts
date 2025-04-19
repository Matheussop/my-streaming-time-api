import { Types } from 'mongoose';
import { UserRepository } from '../userRepository';
import User from '../../models/userModel';
import { IUserResponse, IUserCreate, IUserUpdate } from '../../interfaces/user';

jest.mock('../../models/userModel');

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockUser: IUserResponse;
  let mockUsers: IUserResponse[];

  beforeEach(() => {
    userRepository = new UserRepository();
    mockUser = {
      _id: new Types.ObjectId(),
      username: 'testuser',
      email: 'test@example.com',
      active: true,
      createdAt: new Date('2024-03-20T00:00:00.000Z'),
      updatedAt: new Date('2024-03-20T00:00:00.000Z'),
      profilePicture: 'https://example.com/profile.jpg',
      preferences: {
        favoriteActors: [],
        favoriteGenres: [],
        language: 'en',
        emailNotifications: true,
        pushNotifications: true,
        theme: 'light'
      },
      watchList: [],
      stats: {
        seriesCompleted: 0,
        lastActive: new Date(),
        joinDate: new Date(),
        favoriteStreamingType: new Types.ObjectId(),
        episodesWatched: 0,
        moviesWatched: 0,
        totalWatchTimeInMinutes: 0
      },
      role: 'user'
    } as IUserResponse;

    mockUsers = [
      mockUser,
      {
        ...mockUser,
        _id: new Types.ObjectId(),
        username: 'testuser2',
        email: 'test2@example.com'
      }
    ];

    (User.find as jest.Mock).mockClear();
    (User.findById as jest.Mock).mockClear();
    (User.findOne as jest.Mock).mockClear();
    (User.create as jest.Mock).mockClear();
    (User.findByIdAndUpdate as jest.Mock).mockClear();
    (User.findByIdAndDelete as jest.Mock).mockClear();
  });

  describe('findAll', () => {
    it('should return all users with pagination', async () => {
      (User.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUsers)
          })
        })
      });

      const result = await userRepository.findAll(0, 10);

      expect(User.find).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await userRepository.findById(mockUser._id.toString());

      expect(User.findById).toHaveBeenCalledWith(mockUser._id.toString());
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const result = await userRepository.findById(mockUser._id.toString());

      expect(User.findById).toHaveBeenCalledWith(mockUser._id.toString());
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await userRepository.findByEmail(mockUser.email);

      expect(User.findOne).toHaveBeenCalledWith({ email: mockUser.email });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const result = await userRepository.findByEmail(mockUser.email);

      expect(User.findOne).toHaveBeenCalledWith({ email: mockUser.email });
      expect(result).toBeNull();
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should return user by email with password', async () => {
      const mockUserWithPassword = {
        ...mockUser,
        password: 'hashedPassword'
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserWithPassword)
      });

      const result = await userRepository.findByEmailWithPassword(mockUser.email);

      expect(User.findOne).toHaveBeenCalledWith({ email: mockUser.email });
      expect(result).toEqual(mockUserWithPassword);
    });

    it('should return null if user not found', async () => {
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const result = await userRepository.findByEmailWithPassword(mockUser.email);

      expect(User.findOne).toHaveBeenCalledWith({ email: mockUser.email });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData: IUserCreate = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        active: true
      };

      (User.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await userRepository.create(userData);

      expect(User.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updateData: IUserUpdate = {
        username: 'updateduser',
        email: 'updated@example.com'
      };

      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockUser,
        ...updateData
      });

      const result = await userRepository.update(mockUser._id.toString(), updateData);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id.toString(),
        { $set: updateData },
        { new: true, runValidators: true }
      );
      expect(result).toEqual({
        ...mockUser,
        ...updateData
      });
    });

    it('should return null if user not found', async () => {
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.update(mockUser._id.toString(), { username: 'updateduser' });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id.toString(),
        { $set: { username: 'updateduser' } },
        { new: true, runValidators: true }
      );
      expect(result).toBeNull();
    });
  });

  describe('checkPassword', () => {
    it('should return true if password is correct', async () => {
      const mockUserWithPassword = {
        ...mockUser,
        password: 'hashedPassword',
        correctPassword: jest.fn().mockReturnValue(true)
      };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserWithPassword)
      });

      const result = await userRepository.checkPassword(mockUser._id.toString(), 'password123');

      expect(User.findById).toHaveBeenCalledWith(mockUser._id.toString());
      expect(result).toBe(true);
    });

    it('should return false if password is incorrect', async () => {
      const mockUserWithPassword = {
        ...mockUser,
        password: 'hashedPassword',
        correctPassword: jest.fn().mockReturnValue(false)
      };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserWithPassword)
      });

      const result = await userRepository.checkPassword(mockUser._id.toString(), 'wrongpassword');

      expect(User.findById).toHaveBeenCalledWith(mockUser._id.toString());
      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const result = await userRepository.checkPassword(mockUser._id.toString(), 'password123');

      expect(User.findById).toHaveBeenCalledWith(mockUser._id.toString());
      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

      const result = await userRepository.delete(mockUser._id.toString());

      expect(User.findByIdAndDelete).toHaveBeenCalledWith(mockUser._id.toString());
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.delete(mockUser._id.toString());

      expect(User.findByIdAndDelete).toHaveBeenCalledWith(mockUser._id.toString());
      expect(result).toBeNull();
    });
  });
});

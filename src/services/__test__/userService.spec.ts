import { IUserRepository } from '../../interfaces/repositories';
import { StreamingServiceError } from '../../middleware/errorHandler';
import { IUser } from '../../models/userModel';
import { UserService } from '../userService';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByEmail: jest.fn(),
    };

    userService = new UserService(mockUserRepository);
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Doe', email: 'jane@example.com' },
      ];
      mockUserRepository.findAll.mockResolvedValue(mockUsers as unknown as IUser[]);

      const result = await userService.getAllUsers();

      expect(mockUserRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUserById', () => {
    it('should return a user if found', async () => {
      const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
      mockUserRepository.findById.mockResolvedValue(mockUser as unknown as IUser);

      const result = await userService.getUserById('1');

      expect(mockUserRepository.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById('1')).rejects.toThrow('User not found');
    });
  });

  describe('registerUser', () => {
    it('should register a user successfully', async () => {
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        toObject: jest.fn().mockReturnValue({ id: '1', name: 'John Doe', email: 'john@example.com' }),
      };
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser as unknown as IUser);

      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const result = await userService.registerUser(userData);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'John Doe', email: 'john@example.com' }),
      );
      expect(result).toEqual({ id: '1', name: 'John Doe', email: 'john@example.com' });
    });

    it('should throw an error if email is already in use', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({ id: '1', email: 'john@example.com' } as unknown as IUser);

      const userData = { name: 'John Doe', email: 'john@example.com', password: 'password123' };

      await expect(userService.registerUser(userData)).rejects.toThrow('Email already in use');
    });

    it('should throw an error if email is not valid', async () => {
      const userData = { name: 'John Doe', email: 'john-example.com', password: 'password123' };

      await expect(userService.registerUser(userData)).rejects.toThrow(
        new StreamingServiceError('Invalid email format', 400),
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw an error if password is not valid', async () => {
      const userData = { name: 'John Doe', email: 'john@example.com', password: '12345' };

      await expect(userService.registerUser(userData)).rejects.toThrow(
        new StreamingServiceError('Password must be at least 6 characters long', 400),
      );

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should log in a user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'john@example.com',
        password: 'hashedpassword',
        toObject: jest.fn().mockReturnValue({ id: '1', email: 'john@example.com' }),
      };
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as unknown as IUser);

      const result = await userService.loginUser('john@example.com', 'password123');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(result).toEqual({ id: '1', email: 'john@example.com' });
    });

    it('should throw an error if email is not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(userService.loginUser('john@example.com', 'password123')).rejects.toThrow(
        new StreamingServiceError('Invalid credentials', 401),
      );
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        toObject: jest.fn().mockReturnValue({ id: '1', name: 'John Doe', email: 'updated@example.com' }),
      };
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(mockUser as unknown as IUser);

      const updateData = { email: 'updated@example.com' };

      const result = await userService.updateUser('1', updateData);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('updated@example.com');
      expect(mockUserRepository.update).toHaveBeenCalledWith('1', updateData);
      expect(result).toEqual({ id: '1', name: 'John Doe', email: 'updated@example.com' });
    });

    it('should throw an error if user is not found', async () => {
      mockUserRepository.update.mockResolvedValue(null);

      await expect(userService.updateUser('1', { email: 'updated@example.com' })).rejects.toThrow(
        new StreamingServiceError('User not found', 404),
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      mockUserRepository.delete.mockResolvedValue({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      } as unknown as IUser);

      const result = await userService.deleteUser('1');

      expect(mockUserRepository.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('should throw an error if user is not found', async () => {
      mockUserRepository.delete.mockResolvedValue(null);

      await expect(userService.deleteUser('1')).rejects.toThrow(new StreamingServiceError('User not found', 404));
    });
  });
});

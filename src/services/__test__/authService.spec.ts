import { IUserCreate, IUserResponse } from "../../interfaces/user";
import { UserRepository } from "../../repositories/userRepository";
import { AuthService } from "../authService";
import { TokenService } from "../tokenService";

jest.mock('../../services/tokenService', () => {
  const mockTokenService: TokenService = {
    generateToken: jest.fn(),
    verifyToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  } as unknown as TokenService;

  return {
    TokenService: {
      getInstance: jest.fn().mockReturnValue(mockTokenService)
    }
  };
});

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password')
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockTokenService: jest.Mocked<TokenService>;
  const mockUser: Partial<IUserResponse> = {
    _id: '123',
    email: 'test@example.com',
    username: 'testuser',
    active: true,
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20')
  };

  beforeAll(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      checkPassword: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByEmailWithPassword: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    authService = new AuthService(mockUserRepository);
  });

  beforeEach(() => {
    mockTokenService = TokenService.getInstance() as unknown as jest.Mocked<TokenService>;
    // ANNOTATION: make a valid token and refresh token, 
    // if needed a invalid token and refresh token change in the specific test.
    mockTokenService.generateToken.mockReturnValue('test-token');
    mockTokenService.generateRefreshToken.mockReturnValue('test-refresh-token');
  });

  describe('loginUser', () => {
    it('should login a user and return a valid token', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as IUserResponse);
      mockUserRepository.checkPassword.mockResolvedValue(true);
      
      const result = await authService.loginUser('test@example.com', 'password');

      expect(result).toEqual({
        user: mockUser, 
        token: 'test-token', 
        refreshToken: 'test-refresh-token'
      });
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.checkPassword).toHaveBeenCalledWith(mockUser._id, 'password');
      expect(mockTokenService.generateToken).toHaveBeenCalledWith(mockUser._id);
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith(mockUser._id);
    });

    it('should throw an error if the user is not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      await expect(authService.loginUser('test@example.com', 'password')).rejects.toThrow('Invalid credentials');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw an error if the password is invalid', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as IUserResponse);
      mockUserRepository.checkPassword.mockResolvedValue(false);
      await expect(authService.loginUser('test@example.com', 'password')).rejects.toThrow('Invalid credentials');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.checkPassword).toHaveBeenCalledWith(mockUser._id, 'password');
    });
  });

  describe('validateUser', () => {
    it('should validate a user and return the user', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser as IUserResponse);
      const result = await authService.validateUser(mockUser._id as string);
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if the user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      await expect(authService.validateUser(mockUser._id as string)).rejects.toThrow('User not found');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser._id);
    });
  });

  describe('registerUser', () => {
    it('should register a user if email is not duplicated', async () => {
      const spy = jest.spyOn(authService as any, 'checkDuplicateEmail');

      const mockUserCreate: IUserCreate = {
        ...mockUser,
          password: 'password',  
      } as IUserCreate;
      const mockUserCreateWithHashedPassword = { ...mockUserCreate, password: 'hashed-password' };
      const userWithoutPassword = { ...mockUserCreate, password: undefined };
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(userWithoutPassword as unknown as IUserResponse);
      const result = await authService.registerUser(mockUserCreate);
  
      expect(spy).toHaveBeenCalledWith(mockUser.email);
      expect(result).toEqual(userWithoutPassword);
      expect(mockUserRepository.create).toHaveBeenCalledWith(mockUserCreateWithHashedPassword);
    });

    it('should throw an error if the email is duplicated', async () => {
      const spy = jest.spyOn(authService as any, 'checkDuplicateEmail');
      const mockUserCreate: IUserCreate = {
        ...mockUser,
        password: 'password',  
      } as IUserCreate;
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as IUserResponse);
      await expect(authService.registerUser(mockUserCreate)).rejects.toThrow('Email already in use');
      expect(spy).toHaveBeenCalledWith(mockUser.email);
    });
    
  });
});

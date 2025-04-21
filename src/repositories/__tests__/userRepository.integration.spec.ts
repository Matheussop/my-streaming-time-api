import mongoose from 'mongoose';
import { connect, closeDatabase, clearDatabase } from './mongooseSetup';
import { UserRepository } from '../userRepository';
import User from '../../models/userModel';
import { IUserCreate, IUserResponse, IUserUpdate } from '../../interfaces/user';

describe('UserRepository Integration Tests', () => {
  let userRepository: UserRepository;
  let testUser: IUserResponse;

  const testUserData: IUserCreate = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
    active: true
  };

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    testUser = await User.create(testUserData) as unknown as IUserResponse;

    userRepository = new UserRepository();
  });

  const normalizeUser = (user: any) => ({
    username: user.username,
    email: user.email,
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      const anotherUser: IUserCreate = {
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'password456',
        active: true
      };

      await User.create(anotherUser);

      const users = await userRepository.findAll(0, 2);
      expect(users).toHaveLength(2);
      users.forEach((user) => {
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('email');
        // Verifica que password não está presente
        expect((user as any).password).toBeUndefined();
      });
      expect(normalizeUser(users[1])).toEqual(normalizeUser(anotherUser));
    });

    it('should respect pagination parameters', async () => {
      const usersData = [
        {
          username: 'user1',
          email: 'user1@example.com',
          password: 'password1',
          active: true
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password: 'password2',
          active: true
        },
        {
          username: 'user3',
          email: 'user3@example.com',
          password: 'password3',
          active: true
        }
      ];

      const users = await Promise.all(
        usersData.map(userData => User.create(userData))
      ) as unknown as IUserResponse[];

      const result = await userRepository.findAll(1, 2);

      expect(result).toHaveLength(2);

      result.forEach((user) => {
        expect(user).toHaveProperty('_id');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('email');
        expect(user.email).toMatch(/^user\d@example\.com$/);
      });

      const createdUserIds = users.map((u) => u._id.toString());
      result.forEach((user) => {
        expect(createdUserIds).toContain(user._id.toString());
      });
    });

    it('should return empty array when no users exist', async () => {
      await User.deleteMany({}); // limpa todos os usuários
      const users = await userRepository.findAll(0, 10);
      expect(users).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should find user by id without password', async () => {
      const user = await userRepository.findById(testUser._id);

      expect(user).toBeDefined();
      expect(user?.username).toBe(testUserData.username);
      // Verifica que password não está presente
      expect((user as any).password).toBeUndefined();
    });

    it('should return null for non-existent id', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const user = await userRepository.findById(nonExistentId.toString());

      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email without password', async () => {
      const user = await userRepository.findByEmail('test@example.com');

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
      // Verifica que password não está presente
      expect((user as any).password).toBeUndefined();
    });

    it('should return null for non-existent email', async () => {
      const user = await userRepository.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const newUserData: IUserCreate = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'newpass123',
        active: true
      };

      const newUser = await userRepository.create(newUserData);

      expect(newUser).toBeDefined();
      expect(newUser.username).toBe('newuser');
      expect(newUser.email).toBe('new@example.com');

      const savedUser = await User.findById(newUser._id);
      expect(savedUser).toBeDefined();
      expect(savedUser?.email).toBe('new@example.com');
    });

    it('should throw error when creating user with existing email', async () => {
      const duplicateUserData: IUserCreate = {
        username: 'duplicate',
        email: 'test@example.com', // email já existe
        password: 'password123',
        active: true
      };

      await expect(userRepository.create(duplicateUserData)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      const updateData: Partial<IUserUpdate> = {
        username: 'updateduser',
        email: 'updated@example.com',
      };

      const updatedUser = await userRepository.update(testUser._id, updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.username).toBe('updateduser');
      expect(updatedUser?.email).toBe('updated@example.com');
      // Verifica que password não está presente
      expect((updatedUser as any).password).toBeUndefined();
    });

    it('should return null for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData: Partial<IUserUpdate> = { username: 'updatedname' };

      const result = await userRepository.update(nonExistentId.toString(), updateData);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const deletedUser = await userRepository.delete(testUser._id);

      expect(deletedUser).toBeDefined();
      expect(deletedUser?._id).toEqual(testUser._id);

      // Verificar se foi realmente removido do banco
      const userInDb = await User.findById(testUser._id);
      expect(userInDb).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const result = await userRepository.delete(nonExistentId.toString());

      expect(result).toBeNull();
    });
  });
});

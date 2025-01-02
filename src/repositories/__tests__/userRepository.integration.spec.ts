import mongoose from 'mongoose';
import { connect, closeDatabase, clearDatabase } from './mongooseSetup';
import { UserRepository } from '../userRepository';
import User from '../../models/userModel';
import { IUser } from '../../models/userModel';

describe('UserRepository Integration Tests', () => {
  let userRepository: UserRepository;
  let testUser: IUser;

  const testUserData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
  };

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    testUser = await User.create(testUserData);

    userRepository = new UserRepository();
  });

  const normalizeUser = (user: any) => ({
    name: user.name,
    email: user.email,
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      const anotherUser = {
        name: 'Another User',
        email: 'another@example.com',
        password: 'password456',
      };

      await User.create(anotherUser);

      const users = await userRepository.findAll(0, 2);
      expect(users).toHaveLength(2);
      users.forEach((user) => {
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user.password).toBeUndefined();
      });
      expect(normalizeUser(users[1])).toEqual(normalizeUser(anotherUser));
    });

    it('should respect pagination parameters', async () => {
      const users = await Promise.all([
        User.create({ name: 'User 1', email: 'user1@example.com', password: 'password1' }),
        User.create({ name: 'User 2', email: 'user2@example.com', password: 'password2' }),
        User.create({ name: 'User 3', email: 'user3@example.com', password: 'password3' }),
      ]);

      const result = await userRepository.findAll(1, 2);

      expect(result).toHaveLength(2);

      result.forEach((user) => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user.email).toMatch(/^user\d@example\.com$/);
      });

      const createdUserIds = users.map((u) => u.id);
      result.forEach((user) => {
        expect(createdUserIds).toContain(user.id);
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
      expect(user?.name).toBe('Test User');
      expect(user?.password).toBeUndefined();
    });

    it('should return null for non-existent id', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const user = await userRepository.findById(nonExistentId.toString());

      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email with password', async () => {
      const user = await userRepository.findByEmail('test@example.com');

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
      expect(user?.password).toBeUndefined();
    });

    it('should return null for non-existent email', async () => {
      const user = await userRepository.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const newUserData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'newpass123',
      };

      const newUser = await userRepository.create(newUserData);

      expect(newUser).toBeDefined();
      expect(newUser.name).toBe('New User');
      expect(newUser.email).toBe('new@example.com');
      expect(newUser).toHaveProperty('password');

      const savedUser = await User.findById(newUser._id);
      expect(savedUser).toBeDefined();
      expect(savedUser?.email).toBe('new@example.com');
    });

    it('should throw error when creating user with existing email', async () => {
      const duplicateUserData = {
        name: 'Duplicate User',
        email: 'test@example.com', // email já existe
        password: 'password123',
      };

      await expect(userRepository.create(duplicateUserData)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const updatedUser = await userRepository.update(testUser._id, updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.email).toBe('updated@example.com');
      expect(updatedUser?.password).toBeUndefined();
    });

    it('should return null for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { name: 'Updated Name' };

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

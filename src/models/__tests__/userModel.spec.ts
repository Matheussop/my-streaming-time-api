import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../userModel';
import bcrypt from 'bcrypt';
import Genre from '../genresModel';
import StreamingTypes from '../streamingTypesModel';

describe('User Model', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Genre.deleteMany({});
    await StreamingTypes.deleteMany({});
  });

  describe('User Creation and Validation', () => {
    it('should create a user successfully', async () => {
      const userData = {
        username: 'johndoe',
        email: 'johndoe@example.com',
        password: 'securepassword',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe('johndoe');
      expect(savedUser.email).toBe('johndoe@example.com');
      expect(savedUser.password).toBe('securepassword'); 
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.role).toBe('user'); 
      expect(savedUser.active).toBe(true);
      expect(savedUser.stats!.totalWatchTimeInMinutes).toBe(0);
      expect(savedUser.stats!.moviesWatched).toBe(0);
      expect(savedUser.stats!.episodesWatched).toBe(0);
    });

    it('should fail validation when required fields are missing', async () => {
      const user = new User({});

      let error;
      try {
        await user.save();
      } catch (err: any) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.username).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    it('should validate email format', async () => {
      const invalidUser = new User({
        username: 'testuser',
        email: 'invalidEmail',
        password: 'password123',
      });

      let error;
      try {
        await invalidUser.save();
      } catch (err: any) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    it('should validate username format', async () => {
      const invalidUser = new User({
        username: 'test user@invalid', 
        email: 'valid@example.com',
        password: 'password123',
      });

      let error;
      try {
        await invalidUser.save();
      } catch (err: any) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.username).toBeDefined();
    });

    it('should validate username length', async () => {
      const tooShortUser = new User({
        username: 'ab', 
        email: 'valid@example.com',
        password: 'password123',
      });

      let error;
      try {
        await tooShortUser.save();
      } catch (err: any) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.username).toBeDefined();
    });

    it('should validate password length', async () => {
      const shortPasswordUser = new User({
        username: 'testuser',
        email: 'valid@example.com',
        password: '12345', 
      });

      let error;
      try {
        await shortPasswordUser.save();
      } catch (err: any) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    it('should enforce unique usernames', async () => {
      await User.create({
        username: 'uniqueuser',
        email: 'first@example.com',
        password: 'password123',
      });
      
      const duplicateUser = new User({
        username: 'uniqueuser', 
        email: 'second@example.com', 
        password: 'password123',
      });

      let error;
      try {
        await duplicateUser.save();
      } catch (err: any) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); 
    });

    it('should enforce unique emails', async () => {
      await User.create({
        username: 'firstuser',
        email: 'same@example.com',
        password: 'password123',
      });
      
      const duplicateUser = new User({
        username: 'seconduser', 
        email: 'same@example.com', 
        password: 'password123',
      });

      let error;
      try {
        await duplicateUser.save();
      } catch (err: any) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); 
    });
  });

  describe('User Authentication Methods', () => {
    it('should verify correct password', async () => {
      const plainPassword = 'securepassword';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const user = new User({
        username: 'testauth',
        email: 'testauth@example.com',
        password: hashedPassword,
      });
      
      await user.save();
      
      const isPasswordCorrect = await user.correctPassword(plainPassword);
      expect(isPasswordCorrect).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const plainPassword = 'securepassword';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const user = new User({
        username: 'testauth',
        email: 'testauth@example.com',
        password: hashedPassword,
      });
      
      await user.save();
      
      const isPasswordCorrect = await user.correctPassword(wrongPassword);
      expect(isPasswordCorrect).toBe(false);
    });

    it('should detect password change after JWT issued', async () => {
      const user = new User({
        username: 'testauth',
        email: 'testauth@example.com',
        password: 'securepassword',
      });
      
      await user.save();
      
      const jwtTimestamp = Math.floor(Date.now() / 1000) - 3600;
      
      expect(user.changedPasswordAfter(jwtTimestamp)).toBe(false);
      
      user.passwordChangedAt = new Date();
      await user.save();
      
      expect(user.changedPasswordAfter(jwtTimestamp)).toBe(true);
    });

    it('should create password reset token', async () => {
      const user = new User({
        username: 'resetuser',
        email: 'reset@example.com',
        password: 'securepassword',
      });
      
      const resetToken = user.createPasswordResetToken();
      
      expect(resetToken).toBeDefined();
      expect(typeof resetToken).toBe('string');
      expect(user.passwordResetToken).toBeDefined();
      expect(user.passwordResetExpires).toBeDefined();
      
      const expiration = user.passwordResetExpires!;
      const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);
      
      expect(expiration.getTime()).toBeLessThanOrEqual(tenMinutesFromNow.getTime());
      expect(expiration.getTime()).toBeGreaterThan(new Date().getTime());
    });

    it('should create verification token', async () => {
      const user = new User({
        username: 'verifyuser',
        email: 'verify@example.com',
        password: 'securepassword',
      });
      
      const verificationToken = user.createVerificationToken();
      
      expect(verificationToken).toBeDefined();
      expect(typeof verificationToken).toBe('string');
      expect(user.verificationToken).toBeDefined();
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      await User.create([
        {
          username: 'user1',
          email: 'user1@example.com',
          password: 'password123',
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password: 'password123',
        }
      ]);
    });

    it('should find user by email using findByEmail', async () => {
      const foundUser = await User.findByEmail('user1@example.com');

      expect(foundUser).toBeDefined();
      expect(foundUser?.username).toBe('user1');
      expect(foundUser?.email).toBe('user1@example.com');
    });

    it('should find user by case-insensitive email', async () => {
      const foundUser = await User.findByEmail('USER1@example.com');

      expect(foundUser).toBeDefined();
      expect(foundUser?.username).toBe('user1');
    });

    it('should find user by username or email using findByLogin', async () => {
      const foundByUsername = await User.findByLogin('user1');
      const foundByEmail = await User.findByLogin('user2@example.com');

      expect(foundByUsername).toBeDefined();
      expect(foundByUsername?.username).toBe('user1');
      
      expect(foundByEmail).toBeDefined();
      expect(foundByEmail?.email).toBe('user2@example.com');
    });

    it('should update watch stats correctly', async () => {
      const user = await User.findOne({ username: 'user1' });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      await User.updateWatchStats(user._id, 'movie', 120);
      
      await User.updateWatchStats(user._id, 'episode', 30);
      
      const updatedUser = await User.findById(user._id);
      
      expect(updatedUser?.stats!.totalWatchTimeInMinutes).toBe(150); 
      expect(updatedUser?.stats!.moviesWatched).toBe(2); 
      expect(updatedUser?.stats!.episodesWatched).toBe(0);
      expect(updatedUser?.stats!.lastActive).toBeDefined();
    });
  });

  describe('User Preferences and Stats', () => {
    it('should set user preferences correctly', async () => {
      const actionGenre = await Genre.create({ id: 1, name: 'Action' });
      const dramaGenre = await Genre.create({ id: 2, name: 'Drama' });
      
      const netflix = await StreamingTypes.create({
        name: 'Netflix',
        description: 'Streaming service'
      });
      
      const user = new User({
        username: 'prefuser',
        email: 'preferences@example.com',
        password: 'password123',
        preferences: {
          favoriteGenres: [actionGenre._id, dramaGenre._id],
          contentMaturity: 'PG-13',
          emailNotifications: false,
          pushNotifications: true,
          theme: 'dark',
          language: 'pt-BR',
        },
        stats: {
          favoriteStreamingType: netflix._id,
        }
      });
      
      await user.save();
      
      const savedUser = await User.findById(user._id);
      
      expect(savedUser?.preferences!.favoriteGenres).toHaveLength(2);
      expect(savedUser?.preferences!.contentMaturity).toBe('PG-13');
      expect(savedUser?.preferences!.emailNotifications).toBe(false);
      expect(savedUser?.preferences!.theme).toBe('dark');
      expect(savedUser?.preferences!.language).toBe('pt-BR');
      expect(savedUser?.stats!.favoriteStreamingType).toEqual(netflix._id);
    });

    it('should have watchlist functionality', async () => {
      const user = new User({
        username: 'watchuser',
        email: 'watchlist@example.com',
        password: 'password123',
      });
      
      const contentId1 = new mongoose.Types.ObjectId();
      const contentId2 = new mongoose.Types.ObjectId();
      
      user.watchList = [contentId1, contentId2];
      await user.save();
      
      const savedUser = await User.findById(user._id);
      
      expect(savedUser?.watchList!).toHaveLength(2);
      expect(savedUser?.watchList![0]).toEqual(contentId1);
      expect(savedUser?.watchList![1]).toEqual(contentId2);
    });
  });

  describe('toJSON Transformation', () => {
    it('should exclude sensitive fields in toJSON transformation', async () => {
      const user = new User({
        username: 'jsonuser',
        email: 'json@example.com',
        password: 'securepassword',
        passwordChangedAt: new Date(),
        passwordResetToken: 'sometoken',
        passwordResetExpires: new Date(),
        verificationToken: 'verifytoken',
      });

      const savedUser = await user.save();
      const userJson = savedUser.toJSON();

      expect(userJson.password).toBeUndefined();
      expect(userJson.passwordConfirm).toBeUndefined();
      expect(userJson.passwordChangedAt).toBeUndefined();
      expect(userJson.passwordResetToken).toBeUndefined();
      expect(userJson.passwordResetExpires).toBeUndefined();
      expect(userJson.verificationToken).toBeUndefined();
      expect((userJson as any).__v).toBeUndefined();
      
      expect(userJson.username).toBe('jsonuser');
      expect(userJson.email).toBe('json@example.com');
    });
  });
});

import { Types } from 'mongoose';
import { 
  UserCreateSchema,
  UserUpdateSchema,
  UserLoginSchema
} from '../userSchema';

describe('UserCreateSchema', () => {
  it('should validate a complete valid user object', () => {
    const objectId = new Types.ObjectId();
    const validUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      active: true,
      profilePicture: 'https://example.com/profile.jpg',
      preferences: {
        favoriteActors: [objectId.toString()],
        favoriteGenres: [objectId.toString()],
        contentMaturity: 'PG-13',
        emailNotifications: true,
        pushNotifications: false,
        theme: 'dark',
        language: 'en-US'
      },
      stats: {
        seriesCompleted: 10,
        lastActive: new Date(),
        joinDate: new Date(),
        favoriteStreamingType: objectId,
        episodesWatched: 150,
        moviesWatched: 42,
        totalWatchTimeInMinutes: 15000
      },
      role: 'user'
    };
    
    const result = UserCreateSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('should validate a user with only required fields', () => {
    const validUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!'
    };
    
    const result = UserCreateSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(true);
      expect(result.data.role).toBe('user');
    }
  });

  it('should reject invalid email', () => {
    const invalidUser = {
      username: 'testuser',
      email: 'invalid-email',
      password: 'Password123!'
    };
    
    const result = UserCreateSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid email address');
    }
  });

  it('should reject weak password', () => {
    const invalidUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'weak'
    };
    
    const result = UserCreateSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Password has to be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }
  });

  it('should reject invalid profile picture URL', () => {
    const invalidUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      profilePicture: 'not-a-url'
    };
    
    const result = UserCreateSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });

  it('should reject invalid content maturity value', () => {
    const objectId = new Types.ObjectId();
    const invalidUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      preferences: {
        favoriteActors: [objectId.toString()],
        favoriteGenres: [objectId.toString()],
        contentMaturity: 'INVALID',
        language: 'en-US'
      }
    };
    
    const result = UserCreateSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });

  it('should reject invalid theme value', () => {
    const objectId = new Types.ObjectId();
    const invalidUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      preferences: {
        favoriteActors: [objectId.toString()],
        favoriteGenres: [objectId.toString()],
        theme: 'blue',
        language: 'en-US'
      }
    };
    
    const result = UserCreateSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });

  it('should reject invalid role value', () => {
    const invalidUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      role: 'superadmin'
    };
    
    const result = UserCreateSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });
});

describe('UserUpdateSchema', () => {
  it('should validate a complete update object', () => {
    const objectId = new Types.ObjectId();
    const validUpdate = {
      username: 'updateduser',
      email: 'updated@example.com',
      preferences: {
        favoriteActors: [objectId.toString()],
        favoriteGenres: [objectId.toString()],
        theme: 'light',
        language: 'pt-BR'
      }
    };
    
    const result = UserUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate an empty update object', () => {
    const validUpdate = {};
    
    const result = UserUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate partial updates with one field', () => {
    const validUpdate = {
      username: 'newusername'
    };
    
    const result = UserUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should still validate field constraints', () => {
    const invalidUpdate = {
      email: 'invalid-email'
    };
    
    const result = UserUpdateSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid email address');
    }
  });
});

describe('UserLoginSchema', () => {
  it('should validate valid login credentials', () => {
    const validLogin = {
      email: 'test@example.com',
      password: 'Password123!'
    };
    
    const result = UserLoginSchema.safeParse(validLogin);
    expect(result.success).toBe(true);
  });

  it('should accept any string for password during login', () => {
    const login = {
      email: 'test@example.com',
      password: '12345'  // Simple password is OK for login schema
    };
    
    const result = UserLoginSchema.safeParse(login);
    expect(result.success).toBe(true);
  });

  it('should reject when email is missing', () => {
    const invalidLogin = {
      password: 'Password123!'
    };
    
    const result = UserLoginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
  });

  it('should reject when password is missing', () => {
    const invalidLogin = {
      email: 'test@example.com'
    };
    
    const result = UserLoginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
  });
}); 
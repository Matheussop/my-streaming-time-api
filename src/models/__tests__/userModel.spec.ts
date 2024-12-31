import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../userModel';

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
  });

  it('should create a user successfully', async () => {
    const user = new User({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'securepassword',
    });

    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe('John Doe');
    expect(savedUser.email).toBe('johndoe@example.com');
    expect(savedUser.password).toBe('securepassword'); 
    expect(savedUser.createdAt).toBeDefined();
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
    expect(error.errors.name).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.password).toBeDefined();
  });

  it('should find a user by email using findByEmail', async () => {
    const user = new User({
      name: 'Jane Doe',
      email: 'janedoe@example.com',
      password: 'securepassword',
    });
    await user.save();

    const foundUser = await User.findByEmail('janedoe@example.com');

    expect(foundUser).toBeDefined();
    expect(foundUser?.name).toBe('Jane Doe');
    expect(foundUser?.email).toBe('janedoe@example.com');
  });

  it('should return null if no user is found with findByEmail', async () => {
    const foundUser = await User.findByEmail('nonexistent@example.com');
    expect(foundUser).toBeNull();
  });

  it('should exclude password field in toJSON transformation', async () => {
    const user = new User({
      name: 'Mark Smith',
      email: 'marksmith@example.com',
      password: 'securepassword',
    });

    const savedUser = await user.save();
    const userJson = savedUser.toJSON();

    expect(userJson.password).toBeUndefined();
    expect(userJson.name).toBe('Mark Smith');
  });
});

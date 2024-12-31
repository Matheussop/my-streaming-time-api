import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserStreamingHistory from '../userStreamingHistoryModel';

describe('UserStreamingHistory Model', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri()
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await UserStreamingHistory.deleteMany({});
  });

  it('should create a user streaming history successfully', async () => {
    const userHistory = new UserStreamingHistory({
      userId: 'user123',
      watchHistory: [
        { streamingId: 'stream1', title: 'Movie A', durationInMinutes: 120 },
        { streamingId: 'stream2', title: 'Series B', durationInMinutes: 45 },
      ],
    });

    const savedHistory = await userHistory.save();

    expect(savedHistory._id).toBeDefined();
    expect(savedHistory.userId).toBe('user123');
    expect(savedHistory.watchHistory.length).toBe(2);
    expect(savedHistory.totalWatchTimeInMinutes).toBe(165);
    expect(savedHistory.createdAt).toBeDefined();
  });

  it('should fail validation when required fields are missing', async () => {
    const invalidHistory = new UserStreamingHistory({});

    let error;
    try {
      await invalidHistory.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.userId).toBeDefined();
  });

  it('should update totalWatchTimeInMinutes automatically before saving', async () => {
    const userHistory = new UserStreamingHistory({
      userId: 'user456',
      watchHistory: [
        { streamingId: 'stream3', title: 'Documentary C', durationInMinutes: 30 },
        { streamingId: 'stream4', title: 'Movie D', durationInMinutes: 90 },
      ],
    });

    const savedHistory = await userHistory.save();

    expect(savedHistory.totalWatchTimeInMinutes).toBe(120);

    // Add a new entry and save
    savedHistory.watchHistory.push({ streamingId: 'stream5', title: 'Show E', durationInMinutes: 60 });
    const updatedHistory = await savedHistory.save();

    expect(updatedHistory.totalWatchTimeInMinutes).toBe(180);
  });

  it('should to able to make a toJSON transformation', async () => {
    const userHistory = new UserStreamingHistory({
      userId: 'user789',
      watchHistory: [{ streamingId: 'stream6', title: 'Film F', durationInMinutes: 100 }],
    });

    const savedHistory = await userHistory.save();
    const historyJson = savedHistory.toJSON();

    expect(historyJson).toBeDefined();
    expect(historyJson.userId).toBe('user789');
  });

  it('should prevent negative durationInMinutes in watchHistory', async () => {
    const invalidHistory = new UserStreamingHistory({
      userId: 'userInvalid',
      watchHistory: [{ streamingId: 'stream7', title: 'Bad Entry', durationInMinutes: -10 }],
    });

    let error;
    try {
      await invalidHistory.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors['watchHistory.0.durationInMinutes']).toBeDefined();
  });
});

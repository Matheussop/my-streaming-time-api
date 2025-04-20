import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import LastRequestTime from '../lastRequestTimeModel';

describe('LastRequestTime Model Unit Tests', () => {
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
    await LastRequestTime.deleteMany({});
  });

  describe('LastRequestTime Creation', () => {
    it('should create lastRequestTime with valid data', async () => {
      const validData = {
        lastRequestTime: Date.now()
      };

      const lastRequestTime = await LastRequestTime.create(validData);

      expect(lastRequestTime.lastRequestTime).toBe(validData.lastRequestTime);
    });

    it('should fail when creating lastRequestTime without required field', async () => {
      const invalidData = {};

      await expect(LastRequestTime.create(invalidData)).rejects.toThrow();
    });

    it('should fail when creating lastRequestTime with invalid type', async () => {
      const invalidData = {
        lastRequestTime: 'invalid'
      };

      await expect(LastRequestTime.create(invalidData)).rejects.toThrow();
    });
  });

  describe('toJSON Transform', () => {
    it('should convert to JSON', async () => {
      const lastRequestTime = await LastRequestTime.create({
        lastRequestTime: Date.now()
      });

      const lastRequestTimeJSON = lastRequestTime.toJSON();
      expect(lastRequestTimeJSON).toBeDefined();
    });
  });

  describe('Document Operations', () => {
    it('should update lastRequestTime', async () => {
      const initialTime = Date.now();
      const lastRequestTime = await LastRequestTime.create({
        lastRequestTime: initialTime
      });

      const newTime = Date.now();
      lastRequestTime.lastRequestTime = newTime;
      await lastRequestTime.save();

      const updated = await LastRequestTime.findById(lastRequestTime._id);
      expect(updated!.lastRequestTime).toBe(newTime);
    });

    it('should delete lastRequestTime', async () => {
      const lastRequestTime = await LastRequestTime.create({
        lastRequestTime: Date.now()
      });

      await lastRequestTime.deleteOne();

      const deleted = await LastRequestTime.findById(lastRequestTime._id);
      expect(deleted).toBeNull();
    });
  });
}); 
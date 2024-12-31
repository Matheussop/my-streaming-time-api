import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import StreamingTypes from '../streamingTypesModel';

describe('StreamingTypes Model', () => {
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
    await StreamingTypes.deleteMany({});
  });

  it('should create a streaming type with categories successfully', async () => {
    const streamingType = new StreamingTypes({
      name: 'Movies',
      categories: [
        { id: 1, name: 'Action' },
        { id: 2, name: 'Comedy' },
      ],
    });

    const savedStreamingType = await streamingType.save();

    expect(savedStreamingType._id).toBeDefined();
    expect(savedStreamingType.name).toBe('Movies');
    expect(savedStreamingType.categories.length).toBe(2);
    expect(savedStreamingType.categories[0].id).toBe(1);
    expect(savedStreamingType.categories[0].name).toBe('Action');
    expect(savedStreamingType.createdAt).toBeDefined();
  });

  it('should fail validation when name is missing', async () => {
    const streamingType = new StreamingTypes({
      categories: [{ id: 1, name: 'Action' }],
    });

    let error;
    try {
      await streamingType.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
  });

  it('should fail validation when category is missing fields', async () => {
    const streamingType = new StreamingTypes({
      name: 'Movies',
      categories: [{ name: 'Action' }], // Missing 'id'
    });

    let error;
    try {
      await streamingType.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors['categories.0.id']).toBeDefined();
  });

  it('should enforce unique streaming type names', async () => {
    const streamingType1 = new StreamingTypes({
      name: 'Series',
      categories: [{ id: 1, name: 'Drama' }],
    });
    const streamingType2 = new StreamingTypes({
      name: 'Series', // Duplicate name
      categories: [{ id: 2, name: 'Thriller' }],
    });

    await streamingType1.save();

    let error;
    try {
      await streamingType2.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // Duplicate key error code
  });

  it('should to able to make a toJSON transformation', async () => {
    const streamingType = new StreamingTypes({
      name: 'Documentaries',
      categories: [{ id: 3, name: 'Nature' }],
    });

    const savedStreamingType = await streamingType.save();
    const streamingTypeJson = savedStreamingType.toJSON();

    expect(streamingTypeJson).toBeDefined();
    expect(streamingTypeJson.name).toBe('Documentaries');
  });
});

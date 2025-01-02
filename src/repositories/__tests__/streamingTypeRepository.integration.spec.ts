import mongoose from 'mongoose';
import { connect, closeDatabase, clearDatabase } from './mongooseSetup';
import { StreamingTypeRepository } from '../streamingTypeRepository';
import StreamingType, { ICategory } from '../../models/streamingTypesModel';
import { IStreamingType } from '../../models/streamingTypesModel';
import { IStreamingTypeResponse } from '../../interfaces/streamingTypes';

describe('StreamingTypeRepository Integration Tests', () => {
  let streamingTypeRepository: StreamingTypeRepository;
  let testStreamingType: IStreamingType;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    streamingTypeRepository = new StreamingTypeRepository();
    testStreamingType = await StreamingType.create({
      name: 'Netflix',
      categories: [{ id: 1, name: 'Movies' }],
    });
  });

  describe('findAll', () => {
    it('should return all streaming types', async () => {
      const streamingTypes = await streamingTypeRepository.findAll(0,10);

      expect(streamingTypes).toHaveLength(1);
      expect(streamingTypes[0].name).toBe('Netflix');
    });
  });

  describe('findById', () => {
    it('should return streaming type by id', async () => {
      const foundStreamingType = await streamingTypeRepository.findById(testStreamingType._id.toString());

      expect(foundStreamingType).toBeDefined();
      expect(foundStreamingType?.name).toBe('Netflix');
    });

    it('should return null for non-existent id', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const foundStreamingType = await streamingTypeRepository.findById(nonExistentId);

      expect(foundStreamingType).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return streaming type by name', async () => {
      const foundStreamingType = await streamingTypeRepository.findByName('Netflix');

      expect(foundStreamingType).toBeDefined();
      expect(foundStreamingType?.categories[0].id).toBe(1);
      expect(foundStreamingType?.categories[0].name).toBe('Movies');
    });
  });

  describe('create', () => {
    it('should create a new streaming type', async () => {
      const newStreamingTypeData: IStreamingTypeResponse = {
        name: 'Disney+',
        categories: [{ id: 1, name: 'Series' }],
      } as unknown as IStreamingTypeResponse;

      const newStreamingType = await streamingTypeRepository.create(newStreamingTypeData);

      expect(newStreamingType).toBeDefined();
      expect(newStreamingType.name).toBe('Disney+');
      expect(newStreamingType.categories).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update an existing streaming type', async () => {
      const updatedData = { name: 'Updated Netflix' };

      const updatedStreamingType = await streamingTypeRepository.update(testStreamingType._id.toString(), updatedData);

      expect(updatedStreamingType).toBeDefined();
      expect(updatedStreamingType?.name).toBe('Updated Netflix');
    });

    it('should return null when updating non-existent streaming type', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const updatedStreamingType = await streamingTypeRepository.update(nonExistentId, { name: 'New Name' });

      expect(updatedStreamingType).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing streaming type', async () => {
      const deletedStreamingType = await streamingTypeRepository.delete(testStreamingType._id.toString());

      expect(deletedStreamingType).toBeDefined();
      expect(deletedStreamingType?._id.toString()).toBe(testStreamingType._id.toString());

      const foundStreamingType = await streamingTypeRepository.findById(testStreamingType._id.toString());
      expect(foundStreamingType).toBeNull();
    });

    it('should return null when deleting non-existent streaming type', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const deletedStreamingType = await streamingTypeRepository.delete(nonExistentId);

      expect(deletedStreamingType).toBeNull();
    });
  });

  describe('addCategory', () => {
    it('should update an existing streaming type with news categories', async () => {
      const updatedCategory: ICategory[] = [{ id: 2, name: 'cat3' }];

      const updatedStreamingType = await streamingTypeRepository.addCategory(
        testStreamingType._id.toString(),
        updatedCategory,
      );

      expect(updatedStreamingType).toBeDefined();
      expect(updatedStreamingType?.categories[1]).toEqual(expect.objectContaining(updatedCategory[0]));
    });
  });

  describe('removeCategory', () => {
    it('should update an existing streaming type with news categories', async () => {
      const updatedStreamingType = await streamingTypeRepository.removeCategory(
        testStreamingType._id.toString(),
        testStreamingType?.categories,
      );

      expect(updatedStreamingType).toBeDefined();
      expect(updatedStreamingType?.categories.length).toBe(0);
    });
  });
});

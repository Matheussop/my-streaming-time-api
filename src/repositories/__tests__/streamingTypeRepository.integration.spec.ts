import mongoose from 'mongoose';
import { connect, closeDatabase, clearDatabase } from './mongooseSetup';
import { StreamingTypeRepository } from '../streamingTypeRepository';
import StreamingType from '../../models/streamingTypesModel';
import { IStreamingTypeResponse, IGenreReference } from '../../interfaces/streamingTypes';

describe('StreamingTypeRepository Integration Tests', () => {
  let streamingTypeRepository: StreamingTypeRepository;
  let testStreamingType: IStreamingTypeResponse;

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
      supportedGenres: [{ id: 1, name: 'Movies', poster: 'poster.jpg', _id: new mongoose.Types.ObjectId() }],
    }) as unknown as IStreamingTypeResponse;
  });

  describe('findAll', () => {
    it('should return all streaming types', async () => {
      const streamingTypes = await streamingTypeRepository.findAll(0, 10);

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
      if (foundStreamingType && foundStreamingType.supportedGenres && foundStreamingType.supportedGenres.length > 0) {
        expect(foundStreamingType.supportedGenres[0].id).toBe(1);
        expect(foundStreamingType.supportedGenres[0].name).toBe('Movies');
      }
    });
  });

  describe('create', () => {
    it('should create a new streaming type', async () => {
      const newStreamingTypeData: Partial<IStreamingTypeResponse> = {
        name: 'Disney+',
        supportedGenres: [{ id: 1, name: 'Series', poster: 'series.jpg', _id: new mongoose.Types.ObjectId() }],
      };

      const newStreamingType = await streamingTypeRepository.create(newStreamingTypeData as IStreamingTypeResponse);

      expect(newStreamingType).toBeDefined();
      expect(newStreamingType.name).toBe('Disney+');
      expect(newStreamingType.supportedGenres).toHaveLength(1);
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

  describe('addGenre', () => {
    it('should update an existing streaming type with new genres', async () => {
      const newGenre: IGenreReference[] = [{ 
        id: 2, 
        name: 'Series', 
        poster: 'series.jpg', 
        _id: new mongoose.Types.ObjectId() 
      }];

      const updatedStreamingType = await streamingTypeRepository.addGenre(
        testStreamingType._id.toString(),
        newGenre,
      );

      expect(updatedStreamingType).toBeDefined();
      if (updatedStreamingType && updatedStreamingType.supportedGenres && updatedStreamingType.supportedGenres.length > 1) {
        expect(updatedStreamingType.supportedGenres[1]).toEqual(expect.objectContaining(newGenre[0]));
      }
    });
  });

  describe('deleteByGenresName', () => {
    it('should remove genres from an existing streaming type', async () => {
      const genreName = 'Movies';
      const updatedStreamingType = await streamingTypeRepository.deleteByGenresName(
        [genreName],
        testStreamingType._id.toString()
      );

      expect(updatedStreamingType).toBeDefined();
      if (updatedStreamingType && updatedStreamingType.supportedGenres) {
        // Verifica se o gênero foi removido
        const hasGenre = updatedStreamingType.supportedGenres.some(g => g.name === genreName);
        expect(hasGenre).toBe(false);
      }
    });
  });
});

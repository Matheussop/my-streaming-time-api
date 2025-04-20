import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Genre from '../genresModel';
import { ErrorMessages } from '../../constants/errorMessages';

describe('Genre Model Unit Tests', () => {
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
    await Genre.deleteMany({});
  });

  describe('Genre Creation', () => {
    it('should create genre with valid data', async () => {
      const validGenre = {
        id: 1,
        name: 'Action',
        poster: 'http://example.com/poster.jpg'
      };

      const genre = await Genre.create(validGenre);

      expect(genre.id).toBe(validGenre.id);
      expect(genre.name).toBe(validGenre.name);
      expect(genre.poster).toBe(validGenre.poster);
    });

    it('should create genre without optional fields', async () => {
      const validGenre = {
        id: 1,
        name: 'Action'
      };

      const genre = await Genre.create(validGenre);

      expect(genre.id).toBe(validGenre.id);
      expect(genre.name).toBe(validGenre.name);
      expect(genre.poster).toBe('');
    });

    it('should fail when creating genre without required id', async () => {
      const invalidGenre = {
        name: 'Action'
      };

      await expect(Genre.create(invalidGenre)).rejects.toThrow(ErrorMessages.GENRE_ID_REQUIRED);
    });

    it('should fail when creating genre without required name', async () => {
      const invalidGenre = {
        id: 1
      };

      await expect(Genre.create(invalidGenre)).rejects.toThrow(ErrorMessages.GENRE_NAME_REQUIRED);
    });

    it('should fail when creating genre with duplicate id', async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const duplicateGenre = {
        id: 1,
        name: 'Adventure'
      };

      await expect(Genre.create(duplicateGenre)).rejects.toThrow(/duplicate key error/);
    });

    it('should fail when creating genre with duplicate name', async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const duplicateGenre = {
        id: 2,
        name: 'Action'
      };

      await expect(Genre.create(duplicateGenre)).rejects.toThrow(/duplicate key error/);
    });
  });

  describe('findByName Static Method', () => {
    beforeEach(async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });
    });

    it('should find genre by exact name', async () => {
      const genre = await Genre.findByName('Action');
      expect(genre).not.toBeNull();
      expect(genre!.name).toBe('Action');
    });

    it('should find genre by name case insensitive', async () => {
      const genre = await Genre.findByName('action');
      expect(genre).not.toBeNull();
      expect(genre!.name).toBe('Action');
    });

    it('should return null for non-existent genre name', async () => {
      const genre = await Genre.findByName('NonExistent');
      expect(genre).toBeNull();
    });
  });

  describe('toJSON Transform', () => {
    it('should convert to JSON', async () => {
      const genre = await Genre.create({
        id: 1,
        name: 'Action'
      });

      const genreJSON = genre.toJSON();
      expect(genreJSON).toBeDefined();
      expect((genreJSON as any).__v).toBeUndefined();
    });
  });
}); 
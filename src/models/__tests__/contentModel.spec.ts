import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Content from '../contentModel';
import Genre from '../genresModel';
import { StreamingServiceError } from '../../middleware/errorHandler';

describe('Content Model Unit Tests', () => {
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
    await Content.deleteMany({});
    await Genre.deleteMany({});
  });

  describe('Content Creation', () => {
    it('should create content with valid data', async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const validContent = {
        title: 'Test Content',
        releaseDate: '2024-01-01',
        plot: 'Test plot',
        cast: ['Actor 1', 'Actor 2'],
        rating: 4.5,
        genre: [1],
        url: 'http://example.com',
      };

      const content = await Content.create(validContent);

      expect(content.title).toBe(validContent.title);
      expect(content.rating).toBe(validContent.rating);
      expect(content.genre).toEqual(expect.arrayContaining([expect.objectContaining({ id: 1, name: 'Action' })]));
    });

    it('should be create with a empty release date', async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const validContent = {
        title: 'Test Content',
        releaseDate: '',
        plot: 'Test plot',
        genre: [1],
        url: 'http://example.com',
      };

      const content = await Content.create(validContent);

      expect(content.title).toBe(validContent.title);
      expect(content.releaseDate).toBe(validContent.releaseDate);
      expect(content.plot).toBe(validContent.plot);
    });

    it('should be create with a empty genre', async () => {
      const validContent = {
        title: 'Test Content',
        releaseDate: '',
        plot: 'Test plot',
        genre: [],
        url: 'http://example.com',
      };

      const content = await Content.create(validContent);

      expect(content.title).toBe(validContent.title);
      expect(content.releaseDate).toBe(validContent.releaseDate);
      expect(content.plot).toBe(validContent.plot);
    });

    it('should be create with a object of genre', async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const validContent = {
        title: 'Test Content',
        releaseDate: '',
        plot: 'Test plot',
        genre: [{ id: 1, name: 'Action' }],
        url: 'http://example.com',
      };

      const content = await Content.create(validContent);

      expect(content.title).toBe(validContent.title);
      expect(content.releaseDate).toBe(validContent.releaseDate);
      expect(content.plot).toBe(validContent.plot);
    });

    it('should fail when creating content without required fields', async () => {
      const invalidContent = {
        releaseDate: '2024-01-01',
        plot: 'Test plot',
      };

      await expect(Content.create(invalidContent)).rejects.toThrow();
    });

    it('should fail when creating content with invalid genre', async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const invalidContent = {
        title: 'Test Content',
        releaseDate: '2024-01-01',
        plot: 'Test plot',
        cast: ['Actor 1'],
        rating: 4.5,
        genre: [999],
        url: 'http://example.com',
      };

      await expect(Content.create(invalidContent)).rejects.toThrow();
    })

    it('should fail when creating content with invalid release date format', async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const invalidContent = {
        title: 'Test Content',
        releaseDate: '01-01-2024', // Formato inválido
        plot: 'Test plot',
        cast: ['Actor 1'],
        rating: 4.5,
        genre: [1],
        url: 'http://example.com',
      };

      await expect(Content.create(invalidContent)).rejects.toThrow();
    });

    it('should fail when creating content with invalid type of genre', async () => {
      const invalidContent = {
        title: 'Test Content',
        releaseDate: '2024-01-01',
        plot: 'Test plot',
        genre: { id: 1, name: 'Action' },
        cast: ['Actor 1'],
      };

      await expect(Content.create(invalidContent))
      .rejects.toThrow(
        new StreamingServiceError("Genre must be an array of numbers or an array of objects with id and name properties", 400));
    });

    it('should fail when creating content with invalid type of object genre', async () => {
      const invalidContent = {
        title: 'Test Content',
        releaseDate: '2024-01-01',
        plot: 'Test plot',
        genre: [{ id: 1, name: 1 }],
        cast: ['Actor 1'],
      };

      await expect(Content.create(invalidContent))
      .rejects.toThrow(
        new StreamingServiceError("Genre must be an array of numbers or an array of objects with id and name properties", 400));
    });

    it('should fail when creating content with existing genre empty', async () => {
      const invalidContent = {
        title: 'Test Content',
        releaseDate: '2024-01-01',
        plot: 'Test plot',
        genre: [1],
      };

      await expect(Content.create(invalidContent))
      .rejects.toThrow(
        new StreamingServiceError("The following genre IDs do not exist: 1", 400));
    });

    it('should fail when creating content with genre not exists', async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const invalidContent = {
        title: 'Test Content',
        releaseDate: '2024-01-01',
        plot: 'Test plot',
        genre: [2],
      };

      await expect(Content.create(invalidContent))
      .rejects.toThrow(
        new StreamingServiceError("The following genre IDs do not exist: 2", 400));
    });

    it('should fail when creating content with an genre not exists on database', async () => {
      await Genre.create([{
        id: 1,
        name: 'Action'
      }, {
        id: 2,
        name: 'Adventure'
      }]);
      
      const invalidContent = {
        title: 'Test Content',
        releaseDate: '2024-01-01',
        plot: 'Test plot',
        genre: [1, 1, 3, 2],
      };

      await expect(Content.create(invalidContent))
      .rejects.toThrow(
        new StreamingServiceError("The following genre IDs do not exist: 3", 400));
    });
  });

  describe('insertMany Static Method', () => {
    it('should insert many contents', async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const contents = await Content.insertMany([{
        title: 'Test Content',
        releaseDate: '2024-01-01',
        plot: 'Test plot',
        genre: [1],
        url: 'http://example.com',
      }]);

      expect(contents).toHaveLength(1);
      expect(contents![0].title).toBe('Test Content');
      expect(contents![0].genre).toEqual(expect.arrayContaining([expect.objectContaining({ id: 1, name: 'Action' })]));
    });

    it('should fail when inserting many contents with not exists genre', async () => {
      const contents = [{
          title: 'Test Content',
          releaseDate: '2024-01-01',
          plot: 'Test plot',
          genre: [1],
          url: 'http://example.com',
        }]

      await expect(Content.insertMany(contents)).rejects.toThrow();
    });
  });

  describe('findByTitle Static Method', () => {
    beforeEach(async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const contents = [
        {
          title: 'The Matrix',
          releaseDate: '1999-03-31',
          rating: 4.8,
          genre: [1],
          url: 'http://matrix.com',
        },
        {
          title: 'Matrix Reloaded',
          releaseDate: '2003-05-15',
          rating: 4.5,
          genre: [1],
          url: 'http://matrix2.com',
        },
        {
          title: 'Different Content',
          releaseDate: '2024-01-01',
          rating: 4.0,
          genre: [1],
          url: 'http://different.com',
        },
      ];

      await Content.create(contents);
    });

    it('should find content by partial title', async () => {
      const contents = await Content.findByTitle('Matrix', 0, 10);
      expect(contents).toHaveLength(2);
      expect(contents![0].title).toMatch(/Matrix/);
    });

    it('should respect skip and limit parameters', async () => {
      const contents = await Content.findByTitle('Matrix', 1, 1);
      expect(contents).toHaveLength(1);
    });

    it('should return empty array for non-existent title', async () => {
      const contents = await Content.findByTitle('NonExistent', 0, 10);
      expect(contents).toHaveLength(0);
    });
  });

  describe('findByGenre Static Method', () => {
    beforeEach(async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const contents = [
        {
          title: 'The Matrix',
          releaseDate: '1999-03-31',
          rating: 4.8,
          genre: [1],
          url: 'http://matrix.com',
        },
        {
          title: 'Matrix Reloaded',
          releaseDate: '2003-05-15',
          rating: 4.5,
          genre: [1],
          url: 'http://matrix2.com',
        },
        {
          title: 'Different Content',
          releaseDate: '2024-01-01',
          rating: 4.0,
          genre: [1],
          url: 'http://different.com',
        },
      ];

      await Content.create(contents);
    });

    it('should find content by genre', async () => {
      const contents = await Content.findByGenre('Action', 0, 10);
      expect(contents).toHaveLength(3);
      expect(contents![0].genre).toStrictEqual([expect.objectContaining({ id: 1, name: 'Action' })]);
    });

    it('should respect skip and limit parameters', async () => {
      const contents = await Content.findByGenre('Action', 1, 1);
      expect(contents).toHaveLength(1);
    });
  });

  describe('toJSON Transform', () => {
    it('should convert to JSON', async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const content = await Content.create({
        title: 'Test Content',
        releaseDate: '2024-01-01',
        rating: 4.5,
        genre: [1],
        url: 'http://example.com',
      });

      const contentJSON = content.toJSON();
      expect(contentJSON).toBeDefined();
      expect((contentJSON as any).__v).toBeUndefined();
    });
  });
}); 
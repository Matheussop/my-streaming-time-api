import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Movie from '../movieModel';
import StreamingTypes from '../streamingTypesModel';

describe('Movie Model Integrations Test ', () => {
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
    await Movie.deleteMany({});
    await StreamingTypes.deleteMany({});
  });

  describe('Movie Creation', () => {
    it('should create a movie with valid data', async () => {
      await StreamingTypes.create({
        name: 'Netflix',
        categories: [{ id: 1, name: 'Action' }],
      });

      const validMovie = {
        title: 'Test Movie',
        releaseDate: '2024-01-01',
        plot: 'Test plot',
        cast: ['Actor 1', 'Actor 2'],
        rating: 4.5,
        genre: [1],
        url: 'http://example.com',
      };

      const genre = [{ id: 1, name: "Action",}]
      const movie = await Movie.create(validMovie);

      expect(movie.title).toBe(validMovie.title);
      expect(movie.rating).toBe(validMovie.rating);
      expect(movie.genre).toEqual(expect.arrayContaining(genre));
    });

    it('should fail when creating a movie without required fields', async () => {
      const invalidMovie = {
        releaseDate: '2024-01-01',
        plot: 'Test plot',
      };

      await expect(Movie.create(invalidMovie)).rejects.toThrow();
    });

    it('should fail when creating a movie with invalid genre', async () => {
      await StreamingTypes.create({
        name: 'Netflix',
        categories: [{ id: 1, name: 'Action' }],
      });

      const invalidMovie = {
        title: 'Test Movie',
        releaseDate: '2024-01-01',
        plot: 'Test plot',
        cast: ['Actor 1'],
        rating: 4.5,
        genre: [999],
        url: 'http://example.com',
      };

      await expect(Movie.create(invalidMovie)).rejects.toThrow();
    });
  });

  describe('findByTitle Static Method', () => {
    beforeEach(async () => {
      await StreamingTypes.create({
        name: 'Netflix',
        categories: [{ id: 1, name: 'Action' }],
      });

      const movies = [
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
          title: 'Different Movie',
          releaseDate: '2024-01-01',
          rating: 4.0,
          genre: [1],
          url: 'http://different.com',
        },
      ];

      await Movie.create(movies);
    });

    it('should find movies by partial title', async () => {
      const movies = await Movie.findByTitle('Matrix', 0, 10);
      expect(movies).toHaveLength(2);
      expect(movies![0].title).toMatch(/Matrix/);
    });

    it('should respect skip and limit parameters', async () => {
      const movies = await Movie.findByTitle('Matrix', 1, 1);
      expect(movies).toHaveLength(1);
    });

    it('should return empty array for non-existent title', async () => {
      const movies = await Movie.findByTitle('NonExistent', 0, 10);
      expect(movies).toHaveLength(0);
    });
  });

  describe('findByGenre Static Method', () => {
    beforeEach(async () => {
      await StreamingTypes.create({
        name: 'Netflix',
        categories: [{ id: 1, name: 'Action' }],
      });

      const movies = [
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
          title: 'Different Movie',
          releaseDate: '2024-01-01',
          rating: 4.0,
          genre: [1],
          url: 'http://different.com',
        },
      ];

      await Movie.create(movies);
    });

    it('should find movies by genre', async () => {
      const movies = await Movie.findByGenre('Action', 0, 10);
      expect(movies).toHaveLength(3);
      expect(movies![0].genre).toStrictEqual([{"id": 1, "name": "Action"}]);
    });

    it('should respect skip and limit parameters', async () => {
      const movies = await Movie.findByGenre('Action', 1, 1);
      expect(movies).toHaveLength(1);
    });
  });

  describe('toJSON Transform', () => {
    it('should covert to JSON', async () => {
      await StreamingTypes.create({
        name: 'Netflix',
        categories: [{ id: 1, name: 'Action' }],
      });

      const movie = await Movie.create({
        title: 'Test Movie',
        releaseDate: '2024-01-01',
        rating: 4.5,
        genre: [1],
        url: 'http://example.com',
      });

      const movieJSON = movie.toJSON();
      expect(movieJSON).toBeDefined();
    });
  });
});

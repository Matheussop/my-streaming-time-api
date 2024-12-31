import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Movie from '../movieModel';
import StreamingTypes from '../streamingTypesModel';


describe('Movie Model Integrations Test ', () => {
  let mongoServer: MongoMemoryServer;

  // Configurar conexão com banco de dados antes dos testes
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  // Limpar dados e desconectar após os testes
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Limpar a coleção após cada teste
  afterEach(async () => {
    await Movie.deleteMany({});
    await StreamingTypes.deleteMany({});
  });

  // Teste de criação de filme
  describe('Movie Creation', () => {
    it('should create a movie with valid data', async () => {
      // Criar tipos de streaming com categorias para o teste
      await StreamingTypes.create({
        name: 'Netflix',
        categories: [{ id: 1, name: 'Action' }],
      });

      const validMovie = {
        title: 'Test Movie',
        release_date: '2024-01-01',
        plot: 'Test plot',
        cast: ['Actor 1', 'Actor 2'],
        rating: 4.5,
        genre: [1],
        url: 'http://example.com',
      };

      const movie = await Movie.create(validMovie);
      
      expect(movie.title).toBe(validMovie.title);
      expect(movie.rating).toBe(validMovie.rating);
      expect(movie.genre).toEqual(expect.arrayContaining(validMovie.genre));
    });

    it('should fail when creating a movie without required fields', async () => {
      const invalidMovie = {
        release_date: '2024-01-01',
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
        release_date: '2024-01-01',
        plot: 'Test plot',
        cast: ['Actor 1'],
        rating: 4.5,
        genre: [999], // Gênero inválido
        url: 'http://example.com',
      };

      await expect(Movie.create(invalidMovie)).rejects.toThrow();
    });
  });

  // Teste do método estático findByTitle
  describe('findByTitle Static Method', () => {
    beforeEach(async () => {
      await StreamingTypes.create({
        name: 'Netflix',
        categories: [{ id: 1, name: 'Action' }],
      });

      // Criar alguns filmes para testar a busca
      const movies = [
        {
          title: 'The Matrix',
          release_date: '1999-03-31',
          rating: 4.8,
          genre: [1],
          url: 'http://matrix.com',
        },
        {
          title: 'Matrix Reloaded',
          release_date: '2003-05-15',
          rating: 4.5,
          genre: [1],
          url: 'http://matrix2.com',
        },
        {
          title: 'Different Movie',
          release_date: '2024-01-01',
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

  // Teste de transformação toJSON
  describe('toJSON Transform', () => {
    it('should covert to JSON', async () => {
      await StreamingTypes.create({
        name: 'Netflix',
        categories: [{ id: 1, name: 'Action' }],
      });

      const movie = await Movie.create({
        title: 'Test Movie',
        release_date: '2024-01-01',
        rating: 4.5,
        genre: [1],
        url: 'http://example.com',
      });

      const movieJSON = movie.toJSON();
      expect(movieJSON).toBeDefined();
    });
  });
});
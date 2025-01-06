import request from 'supertest';
import express from 'express';
import { HttpStatus } from '../../constants/httpStatus';
import { Messages } from '../../constants/messages';
import * as validateModule from '../../util/validate';

const mockImplementations = {
  getMoviesByTitle: jest.fn(),
  createMovie: jest.fn(),
  getMovies: jest.fn(),
  getMovieById: jest.fn(),
  updateMovie: jest.fn(),
  getMoviesByGenre: jest.fn(),
  deleteMovie: jest.fn(),
};

jest.mock('../../controllers/movieController', () => ({
  MovieController: jest.fn().mockImplementation(() => mockImplementations),
}));

const mockGetExternalMovies = jest.fn();
const mockFetchAndSaveExternalMovies = jest.fn();
const mockFindOrAddMovie = jest.fn();

jest.mock('../../controllers/movieTMDBController', () => ({
  getExternalMovies: mockGetExternalMovies,
  fetchAndSaveExternalMovies: mockFetchAndSaveExternalMovies,
  findOrAddMovie: mockFindOrAddMovie,
}));

jest.mock('../../util/validate', () => ({
  validateRequest: jest.fn(),
}));

import router from '../movieRoutes';
describe('Movie Routes', () => {
  let app: express.Application;
  let mockValidateRequest: jest.Mock;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/movies', router);
    mockValidateRequest = validateModule.validateRequest as jest.Mock;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateRequest.mockImplementation((req, res, next) => next());
  });

  describe('GET /title', () => {
    it('should return movies by title', async () => {
      const mockMovies = [{ id: '1', title: 'Test Movie', rating: 8.5 }];

      mockImplementations.getMoviesByTitle.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json(mockMovies);
      });

      const response = await request(app).get('/movies/title').query({ title: 'Test Movie' }).expect(HttpStatus.OK);

      expect(response.body).toEqual(mockMovies);
    });
  });

  describe('POST /byGenre', () => {
    it('should return movies by genre', async () => {
      const mockMovies = [{ id: '1', genre: 'Test genre', rating: 8.5 }];

      mockImplementations.getMoviesByGenre.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json(mockMovies);
      });

      const response = await request(app).post('/movies/byGenre').query({ genre: 'Test genre' }).expect(HttpStatus.OK);

      expect(response.body).toEqual(mockMovies);
    });
  });

  describe('POST /', () => {
    it('should create a new movie', async () => {
      const newMovie = {
        title: 'New Movie',
        plot: 'Test plot',
        cast: ['Actor 1', 'Actor 2'],
        rating: 9.0,
        url: 'http://movie.com',
        release_date: '2024-01-01',
      };

      mockImplementations.createMovie.mockImplementation((req, res) => {
        res.status(HttpStatus.ACCEPTED).json({ id: '1', ...newMovie });
      });

      await request(app).post('/movies').send(newMovie).expect(HttpStatus.ACCEPTED);
    });
  });

  describe('GET /', () => {
    it('should return list of movies with pagination', async () => {
      const mockMovies = {
        data: [
          { id: '1', title: 'Movie 1' },
          { id: '2', title: 'Movie 2' },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      mockImplementations.getMovies.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json(mockMovies);
      });

      const response = await request(app).get('/movies').query({ page: 1, limit: 10 }).expect(HttpStatus.OK);

      expect(response.body).toEqual(mockMovies);
    });
  });

  describe('GET /external', () => {
    it('should return external movies', async () => {
      const mockExternalMovies = [
        { id: 1, title: 'External Movie 1' },
        { id: 2, title: 'External Movie 2' },
      ];

      mockGetExternalMovies.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json(mockExternalMovies);
      });

      const response = await request(app).get('/movies/external').expect(HttpStatus.OK);

      expect(response.body).toEqual(mockExternalMovies);
    });
  });

  describe('POST /external', () => {
    it('should fetch and save external movies', async () => {
      mockFetchAndSaveExternalMovies.mockImplementation((req, res) => {
        res.status(HttpStatus.ACCEPTED).json({ message: Messages.MOVIE_FETCHED_AND_SAVED_SUCCESSFULLY });
      });

      await request(app).post('/movies/saveExternalMovies').expect(HttpStatus.ACCEPTED);
    });
  });

  describe('POST /findOrAddMovie', () => {
    it('should find or add a movie', async () => {
      const movieData = {
        title: 'Movie to Find',
        page: 1,
        limit: 10,
      };

      mockFindOrAddMovie.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json({ id: '1', title: 'Movie to Find' });
      });

      await request(app).post('/movies/findOrAddMovie').send(movieData).expect(HttpStatus.OK);
    });
  });

  describe('GET /:id', () => {
    it('should return a movie by id', async () => {
      const mockMovie = {
        id: '1',
        title: 'Test Movie',
        rating: 8.5,
      };

      mockImplementations.getMovieById.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json(mockMovie);
      });

      const response = await request(app).get('/movies/1').expect(HttpStatus.OK);

      expect(response.body).toEqual(mockMovie);
    });
  });

  describe('PUT /:id', () => {
    it('should update a movie', async () => {
      const updateData = {
        title: 'Updated Movie',
        plot: 'Updated plot',
        cast: ['Actor 1', 'Actor 2'],
        rating: 9.5,
        url: 'http://updated-movie.com',
        release_date: '2024-02-01',
      };

      mockImplementations.updateMovie.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json({ id: '1', ...updateData });
      });

      await request(app).put('/movies/1').send(updateData).expect(HttpStatus.OK);
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a movie', async () => {
      mockImplementations.deleteMovie.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json({ message: Messages.MOVIE_DELETED_SUCCESSFULLY });
      });

      await request(app).delete('/movies/1').expect(HttpStatus.OK);
    });
  });
});

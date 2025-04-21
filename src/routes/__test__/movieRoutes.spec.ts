import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../constants/httpStatus';
import { Messages } from '../../constants/messages';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/__tests__/generateValidObjectId';

const mockImplementations = {
  getMoviesByTitle: jest.fn(),
  createMovie: jest.fn(),
  getMovies: jest.fn(),
  getMovieById: jest.fn(),
  updateMovie: jest.fn(),
  updateMovieFromTMDB: jest.fn(),
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

jest.mock('../../middleware/validationMiddleware', () => ({
  validate: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

jest.mock('../../middleware/objectIdValidationMiddleware', () => ({
  validateObjectId: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => {
    req.validatedIds = req.validatedIds || {};
    const id = req.params.id || req.params._id || '507f1f77bcf86cd799439011';
    req.validatedIds.id = new Types.ObjectId(id);
    next();
  }),
}));

import router from '../movieRoutes';

describe('Movie Routes', () => {
  let app: express.Application;
  let mockId: string | Types.ObjectId;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/movies', router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockId = generateValidObjectId();
  });

  describe('GET /title', () => {
    it('should return movies by title', async () => {
      const mockMovies = [{ _id: mockId.toString(), title: 'Test Movie', rating: 8.5 }];

      mockImplementations.getMoviesByTitle.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockMovies);
      });

      const response = await request(app)
        .get('/movies/title')
        .query({ title: 'Test Movie' })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockMovies);
    });
  });

  describe('POST /byGenre', () => {
    it('should return movies by genre', async () => {
      const mockMovies = [{ _id: mockId.toString(), genre: [{id: 1, name: 'Action'}], rating: 8.5 }];

      mockImplementations.getMoviesByGenre.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockMovies);
      });

      const response = await request(app)
        .post('/movies/byGenre')
        .send({ genre: 'Action' })
        .expect(HttpStatus.OK);

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
        releaseDate: '2024-01-01',
        genre: [{ id: 1, name: 'Action' }],
      };

      mockImplementations.createMovie.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.CREATED).json({ _id: mockId.toString(), ...newMovie });
      });

      const response = await request(app)
        .post('/movies')
        .send(newMovie)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({ _id: mockId.toString(), ...newMovie });
    });
  });

  describe('GET /', () => {
    it('should return list of movies with pagination', async () => {
      const mockMovies = {
        data: [
          { _id: mockId.toString(), title: 'Movie 1' },
          { _id: generateValidObjectId().toString(), title: 'Movie 2' },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      mockImplementations.getMovies.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockMovies);
      });

      const response = await request(app)
        .get('/movies')
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockMovies);
    });
  });

  describe('GET /external', () => {
    it('should return external movies', async () => {
      const mockExternalMovies = [
        { id: 1, title: 'External Movie 1' },
        { id: 2, title: 'External Movie 2' },
      ];

      mockGetExternalMovies.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockExternalMovies);
      });

      const response = await request(app)
        .get('/movies/external')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockExternalMovies);
    });
  });

  describe('POST /saveExternalMovies', () => {
    it('should fetch and save external movies', async () => {
      mockFetchAndSaveExternalMovies.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.ACCEPTED).json({ message: Messages.MOVIE_FETCHED_AND_SAVED_SUCCESSFULLY });
      });

      const response = await request(app)
        .post('/movies/saveExternalMovies')
        .expect(HttpStatus.ACCEPTED);

      expect(response.body).toEqual({ message: Messages.MOVIE_FETCHED_AND_SAVED_SUCCESSFULLY });
    });
  });

  describe('POST /findOrAddMovie', () => {
    it('should find or add a movie', async () => {
      const movieData = {
        title: 'Movie to Find',
        page: 1,
        limit: 10,
      };

      mockFindOrAddMovie.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ _id: mockId.toString(), title: 'Movie to Find' });
      });

      const response = await request(app)
        .post('/movies/findOrAddMovie')
        .send(movieData)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ _id: mockId.toString(), title: 'Movie to Find' });
    });
  });

  describe('GET /:id', () => {
    it('should return a movie by id', async () => {
      const mockMovie = {
        _id: mockId.toString(),
        title: 'Test Movie',
        rating: 8.5,
      };

      mockImplementations.getMovieById.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockMovie);
      });

      const response = await request(app)
        .get(`/movies/${mockId}`)
        .expect(HttpStatus.OK);

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
        releaseDate: '2024-02-01',
      };

      mockImplementations.updateMovie.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ _id: mockId.toString(), ...updateData });
      });

      const response = await request(app)
        .put(`/movies/${mockId}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ _id: mockId.toString(), ...updateData });
    });
  });

  describe('PUT /:id/:tmdbId', () => {
    it('should update a movie from TMDB', async () => {
      const tmdbId = 12345;
      
      mockImplementations.updateMovieFromTMDB.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ 
          _id: mockId.toString(), 
          title: 'TMDB Movie',
          tmdbId: tmdbId 
        });
      });

      const response = await request(app)
        .put(`/movies/${mockId}/${tmdbId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ 
        _id: mockId.toString(), 
        title: 'TMDB Movie',
        tmdbId: tmdbId 
      });
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a movie', async () => {
      mockImplementations.deleteMovie.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ message: Messages.MOVIE_DELETED_SUCCESSFULLY });
      });

      const response = await request(app)
        .delete(`/movies/${mockId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ message: Messages.MOVIE_DELETED_SUCCESSFULLY });
    });
  });
});

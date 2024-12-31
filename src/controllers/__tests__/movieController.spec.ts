import { generateValidObjectId } from './../../util/test/generateValidObjectId';
import { NextFunction, Request, Response } from 'express';
import { MovieController } from '../movieController';
import { MovieRepository } from '../../repositories/movieRepository';
import { MovieService } from '../../services/movieService';
import Movie, { IMovie } from '../../models/movieModel';
import { StreamingServiceError } from '../../middleware/errorHandler';
import { ErrorMessages } from '../../constants/errorMessages';
import { Messages } from '../../constants/messages';

jest.mock('../../services/movieService');

describe('MovieController', () => {
  let controller: MovieController;
  let mockService: jest.Mocked<MovieService>;
  let mockMovieRepository: jest.Mocked<MovieRepository>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let validId: string;

  beforeEach(() => {
    validId = generateValidObjectId();
    mockMovieRepository = {} as jest.Mocked<MovieRepository>;
    mockService = new MovieService(mockMovieRepository) as jest.Mocked<MovieService>;
    controller = new MovieController(mockService);
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('getMoviesByTitle', () => {
    it('should return movies filtered by title', async () => {
      const mockMovies: IMovie[] = [{ id: validId, title: 'Test Movie' }] as IMovie[];
      mockReq = {
        body: { title: 'Test' },
        method: 'GET',
        path: '/movies/search'
      };
      mockService.getMoviesByTitle.mockResolvedValue(mockMovies);

      await controller.getMoviesByTitle(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getMoviesByTitle).toHaveBeenCalledWith('Test', 0, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockMovies);
    });
  });

  describe('getMovies', () => {
    it('should return paginated movies list', async () => {
      const validSecondaryId = generateValidObjectId();
      const mockMovies: IMovie[] = [{ id: validId, title: 'Movie 1' }, { id: validSecondaryId, title: 'Movie 2' }] as IMovie[];
      mockReq = {
        body: {},
        method: 'GET',
        path: '/movies'
      };
      mockService.getMovies.mockResolvedValue(mockMovies);

      await controller.getMovies(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getMovies).toHaveBeenCalledWith(0, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockMovies);
    });

    it('should throw error when limit exceeds 100', async () => {
      mockReq = {
        body: { page: 1, limit: 101 },
        method: 'GET',
        path: '/movies'
      };

      await controller.getMovies(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new StreamingServiceError(ErrorMessages.MOVIE_FETCH_LIMIT_EXCEEDED, 400));
    });
  });

  describe('getMovieById', () => {

    it('should return movie by id', async () => {
      const mockMovie: IMovie = { id: validId, title: 'Test Movie' } as IMovie;
      mockReq = {
        params: { id: validId },
        method: 'GET',
        path: `/movies/${validId}`
      };
      mockService.getMovieById.mockResolvedValue(mockMovie);

      await controller.getMovieById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getMovieById).toHaveBeenCalledWith(validId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockMovie);
    });

    it('should throw error for invalid movie id format', async () => {
      mockReq = {
        params: { id: 'invalid-id' },
        method: 'GET',
        path: '/movies/invalid-id'
      };

      await controller.getMovieById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new StreamingServiceError(ErrorMessages.MOVIE_ID_INVALID, 400));
    });
  });

  describe('createMovie', () => {
    it('should create new movie successfully', async () => {
      const movieData = {
        title: 'New Movie',
        release_date: '2024-01-01',
        plot: 'Test plot',
        cast: ['Actor 1'],
        genre: [1,2],
        rating: 8.5,
        url: 'movie-url'
      };

      const mockCreatedMovie = { id: validId, ...movieData } as IMovie;
      mockReq = {
        body: movieData,
        method: 'POST',
        path: '/movies'
      };
      mockService.createMovie.mockResolvedValue(mockCreatedMovie);

      await controller.createMovie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.createMovie).toHaveBeenCalledWith(expect.any(Movie));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockCreatedMovie);
    });

    it('should throw error when request body is missing', async () => {
      mockReq = {
        body: {},
        method: 'POST',
        path: '/movies'
      };

      await controller.createMovie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new StreamingServiceError(ErrorMessages.BODY_REQUIRED, 400));
    });
  });

  describe('updateMovie', () => {
    it('should update movie successfully', async () => {
      const updateData = { title: 'Updated Movie' };
      const mockUpdatedMovie = { id: validId, ...updateData } as IMovie;
      mockReq = {
        params: { id: validId },
        body: updateData,
        method: 'PUT',
        path: `/movies/${validId}`
      };
      mockService.updateMovie.mockResolvedValue(mockUpdatedMovie);

      await controller.updateMovie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.updateMovie).toHaveBeenCalledWith(validId, updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUpdatedMovie);
    });

    it('should throw error for invalid movie id format', async () => {
      mockReq = {
        params: { id: 'invalid-id' },
        body: { title: 'Updated Movie' },
        method: 'PUT',
        path: '/movies/invalid-id'
      };

      await controller.updateMovie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new StreamingServiceError(ErrorMessages.MOVIE_ID_INVALID, 400));
    });

    it('should throw error when update data is missing', async () => {
      mockReq = {
        params: { id: validId },
        body: {},
        method: 'PUT',
        path: `/movies/${validId}`
      };

      await controller.updateMovie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new StreamingServiceError(ErrorMessages.BODY_REQUIRED, 400));
    });
  });

  describe('deleteMovie', () => {
    it('should delete movie successfully', async () => {
      mockReq = {
        params: { id: validId },
        method: 'DELETE',
        path: `/movies/${validId}`
      };


      await controller.deleteMovie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.deleteMovie).toHaveBeenCalledWith(validId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: Messages.MOVIE_DELETED_SUCCESSFULLY });
    });

    it('should throw error for invalid movie id format', async () => {
      mockReq = {
        params: { id: 'invalid-id' },
        method: 'DELETE',
        path: '/movies/invalid-id'
      };

      await controller.deleteMovie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new StreamingServiceError(ErrorMessages.MOVIE_ID_INVALID, 400));
    });
  });
});
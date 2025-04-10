import { generateValidObjectId } from './../../util/test/generateValidObjectId';
import { NextFunction, Request, Response } from 'express';
import { MovieController } from '../movieController';
import { MovieRepository } from '../../repositories/movieRepository';
import { MovieService } from '../../services/movieService';
import Movie from '../../models/movieModel';

import { Messages } from '../../constants/messages';
import { StreamingTypeRepository } from '../../repositories/streamingTypeRepository';
import { Types } from 'mongoose';
import { TMDBService } from '../../services/tmdbService';
import { IMovieResponse } from '../../interfaces/movie';
import { IGenreReference } from '../../interfaces/streamingTypes';

jest.mock('../../services/movieService');
jest.mock('../../config/logger');

describe('MovieController', () => {
  let controller: MovieController;
  let mockService: jest.Mocked<MovieService>;
  let mockMovieRepository: jest.Mocked<MovieRepository>;
  let mockStreamingTypeRepository: jest.Mocked<StreamingTypeRepository>;
  let mockTMDBService: jest.Mocked<TMDBService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let validId: Types.ObjectId | string;
  let mockGenre: IGenreReference;
  let mockMovie: IMovieResponse;

  beforeEach(() => {
    validId = generateValidObjectId();
    mockGenre = { _id: validId, id: 1, name: 'Action', poster: 'poster-url' };
    mockMovieRepository = {} as jest.Mocked<MovieRepository>;
    mockStreamingTypeRepository = {} as jest.Mocked<StreamingTypeRepository>;
    mockTMDBService = {} as jest.Mocked<TMDBService>;
    mockService = new MovieService(mockTMDBService, mockMovieRepository) as jest.Mocked<MovieService>;
    controller = new MovieController(mockService);
    mockReq = {
      validatedIds: { id: validId as Types.ObjectId },
      query: {},
      body: {},
      method: 'GET',
      path: '/movies'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnValue(mockRes),
      send: jest.fn(),
    };
    mockNext = jest.fn();
    mockMovie = { 
      _id: validId as Types.ObjectId, 
      title: 'Test Movie',
      genre: [mockGenre],
      durationTime: 120,
      releaseDate: '2024-01-01',
      plot: 'Test plot',
      cast: ['Actor 1'],
      rating: 8.5,
      poster: 'poster-url',
      url: 'movie-url',
      videoUrl: 'video-url',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe('getMoviesByTitle', () => {
    it('should return movies filtered by title', async () => {
      const moviesByTitle = [mockMovie];
      mockReq.body = { title: 'Test' };
      mockService.getMoviesByTitle.mockResolvedValue(moviesByTitle);

      await controller.getMoviesByTitle(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getMoviesByTitle).toHaveBeenCalledWith('Test', 0, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(moviesByTitle);
    });
  });

  describe('getMoviesByGenre', () => {
    it('should return movies filtered by genre', async () => {
      const moviesByGenre = [mockMovie];
      mockReq.body = { genre: 'Test' };
      mockService.getMoviesByGenre.mockResolvedValue(moviesByGenre);

      await controller.getMoviesByGenre(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getMoviesByGenre).toHaveBeenCalledWith('Test', 0, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(moviesByGenre);
    });
  });

  describe('getMovies', () => {
    it('should return paginated movies list', async () => {
      const validSecondaryId = new Types.ObjectId();
      const paginatedMovies = [
        mockMovie,
        { ...mockMovie, _id: validSecondaryId, title: 'Movie 2' }
      ];
      mockReq.query = { page: '1', limit: '10' };
      mockService.getMovies.mockResolvedValue(paginatedMovies);

      await controller.getMovies(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getMovies).toHaveBeenCalledWith(0, "10");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(paginatedMovies);
    });

    it('should use default pagination values when not provided', async () => {
      const defaultMovies = [mockMovie];
      mockReq.query = {};
      mockService.getMovies.mockResolvedValue(defaultMovies);

      await controller.getMovies(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getMovies).toHaveBeenCalledWith(0, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(defaultMovies);
    });
  });

  describe('getMovieById', () => {
    it('should return movie by id', async () => {
      const movieById = mockMovie;
      mockService.getMovieById.mockResolvedValue(movieById);

      await controller.getMovieById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getMovieById).toHaveBeenCalledWith(validId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(movieById);
    });
  });

  describe('createMovie', () => {
    it('should create new movie successfully', async () => {
      const newMovie = mockMovie;
      const movieData = newMovie;
      mockReq.body = movieData;
      mockService.createMovie.mockResolvedValue(newMovie);

      await controller.createMovie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.createMovie).toHaveBeenCalledWith(expect.any(Movie));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(newMovie);
    });
  });

  describe('updateMovie', () => {
    it('should update movie successfully', async () => {
      const updateData = { title: 'Updated Movie' };
      const updatedMovie = { ...mockMovie, title: updateData.title };
      mockReq.body = updateData;
      mockService.updateMovie.mockResolvedValue(updatedMovie);

      await controller.updateMovie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.updateMovie).toHaveBeenCalledWith(validId, updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(updatedMovie);
    });
  });

  describe('deleteMovie', () => {
    it('should delete movie successfully', async () => {
      mockService.deleteMovie.mockResolvedValue({} as IMovieResponse);
      
      await controller.deleteMovie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.deleteMovie).toHaveBeenCalledWith(validId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: Messages.MOVIE_DELETED_SUCCESSFULLY });
    });
  });

  describe('updateMovieFromTMDB', () => {
    it('should update movie from TMDB successfully', async () => {
      const tmdbId = '12345';
      const tmdbUpdatedMovie = mockMovie;
      mockReq.params = { tmdbId };
      mockService.updateMovieFromTMDB.mockResolvedValue();

      await controller.updateMovieFromTMDB(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.updateMovieFromTMDB).toHaveBeenCalledWith(validId, Number(tmdbId));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});

import { Request, Response } from 'express';
import axios from 'axios';
import Movie from '../../models/movieModel';
import { getExternalMovies, fetchAndSaveExternalMovies, findOrAddMovie } from '../movieTMDBController';

describe('Movie Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let axiosGetSpy: jest.SpyInstance;
  let movieFindSpy: jest.SpyInstance;
  let movieInsertManySpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    axiosGetSpy = jest.spyOn(axios, 'get');
    movieFindSpy = jest.spyOn(Movie, 'find');
    movieInsertManySpy = jest.spyOn(Movie, 'insertMany');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getExternalMovies', () => {
    const mockMovieData = {
      data: {
        results: [
          {
            id: 1,
            title: 'Test Movie',
            release_date: '2024-01-01',
            overview: 'Test overview',
            genre_ids: [28, 12],
            vote_average: 8.5,
            poster_path: '/test-path.jpg',
          },
        ],
      },
    };

    it('should fetch and return movies successfully', async () => {
      axiosGetSpy.mockResolvedValueOnce(mockMovieData);

      await getExternalMovies(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(axiosGetSpy).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/movie/popular?language=pt-BR&page=1',
        expect.any(Object)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            title: 'Test Movie',
            year: '2024-01-01',
            plot: 'Test overview',
            genre: [28, 12],
            rating: 8.5,
            url: expect.stringContaining('/test-path.jpg'),
          }),
        ])
      );
    });

    it('should handle API errors', async () => {
      const errorMessage = 'API Error';
      axiosGetSpy.mockRejectedValueOnce(new Error(errorMessage));

      await getExternalMovies(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: errorMessage,
      });
    });
  });

  describe('fetchAndSaveExternalMovies', () => {
    const movieInDataBase = {
      title: 'Other Movie',
      release_date: '2024-01-01',
      overview: 'Test overview',
      genre_ids: [28, 12],
      vote_average: 8.5,
      poster_path: '/test-path.jpg',
    };
    const mockMovieData = {
      data: {
        results: [
          {
            title: 'New Movie',
            release_date: '2024-01-01',
            overview: 'Test overview',
            genre_ids: [28, 12],
            vote_average: 8.5,
            poster_path: '/test-path.jpg',
          },
          movieInDataBase
        ],
      },
    };

    it('should fetch and save new movies successfully', async () => {
      axiosGetSpy.mockResolvedValueOnce(mockMovieData);
      movieFindSpy.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue([movieInDataBase]),
      });
      
      movieInsertManySpy.mockResolvedValueOnce([
        { ...mockMovieData.data.results[0], _id: 'new-id' },
      ]);

      await fetchAndSaveExternalMovies(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
      expect(movieFindSpy).toHaveBeenCalledTimes(1);
      expect(movieInsertManySpy).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'New Movie',
          }),
        ])
      );
    });

    it('should handle database errors', async () => {
      const errorMessage = 'Database Error';
      axiosGetSpy.mockResolvedValueOnce(mockMovieData);
      movieFindSpy.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error(errorMessage)),
      });

      await fetchAndSaveExternalMovies(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: errorMessage,
      });
    });
  });

  describe('findOrAddMovie', () => {
    beforeEach(() => {
      movieFindSpy.mockReset();
    });

    it('should return error when title is missing', async () => {
      mockRequest.body = {};

      await findOrAddMovie(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Title parameter is required',
      });
    });

    it('should return existing movies when found in database', async () => {
      mockRequest.body = { title: 'Existing Movie' };
      const existingMovies = Array(6).fill({
        title: 'Existing Movie',
        _id: 'test-id',
      });

      const mockLean = jest.fn().mockResolvedValue(existingMovies);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      movieFindSpy.mockReturnValue({ skip: mockSkip });

      await findOrAddMovie(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        total: 6,
        movies: existingMovies,
      });
    });

    it('should handle missing TMDB token', async () => {
      const originalToken = process.env.TMDB_Bearer_Token;
      process.env.TMDB_Bearer_Token = '';
      mockRequest.body = { title: 'New Movie' };

      const mockLean = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      movieFindSpy.mockReturnValue({ skip: mockSkip });

      await findOrAddMovie(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid TMDB_Bearer_Token',
      });

      process.env.TMDB_Bearer_Token = originalToken;
    });

    it('should fetch and save new movies from TMDB when not in database', async () => {
      mockRequest.body = { title: 'New Movie' };
      process.env.TMDB_Bearer_Token = 'valid-token';

      const tmdbResponse = {
        data: {
          results: [{
            title: 'New Movie',
            release_date: '2024-01-01',
            overview: 'Test overview',
            vote_average: 8.5,
            genre_ids: [28, 12],
            poster_path: '/test-path.jpg',
          }],
        },
      };

      const mockLean = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      movieFindSpy.mockReturnValueOnce({ skip: mockSkip });

      axiosGetSpy.mockResolvedValueOnce(tmdbResponse);
      movieFindSpy.mockReturnValue({ lean: mockLean });
      movieInsertManySpy.mockResolvedValueOnce([
        { ...tmdbResponse.data.results[0], _id: 'new-id' },
      ]);

      await findOrAddMovie(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        total: 1,
        movies: expect.arrayContaining([
          expect.objectContaining({
            title: 'New Movie',
          }),
        ]),
      });
    });

    it('should handle TMDB API errors', async () => {
      mockRequest.body = { title: 'New Movie' };
      process.env.TMDB_Bearer_Token = 'valid-token';

      const mockLean = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      movieFindSpy.mockReturnValue({ skip: mockSkip });

      axiosGetSpy.mockRejectedValueOnce(new Error('TMDB API Error'));

      await findOrAddMovie(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'TMDB API Error',
      });
    });

    it('should just fetch movies of TMDB if they already exist in database', async () => {
      mockRequest.body = { title: 'New Movie' };
      process.env.TMDB_Bearer_Token = 'valid-token';

      const tmdbResponse = {
        data: {
          results: [{
            title: 'New Movie',
            release_date: '2024-01-01',
            overview: 'Test overview',
            vote_average: 8.5,
            genre_ids: [28, 12],
            poster_path: '/test-path.jpg',
          }],
        },
      };

      const mockLean = jest.fn().mockResolvedValue(tmdbResponse.data.results);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      movieFindSpy.mockReturnValueOnce({ skip: mockSkip });

      axiosGetSpy.mockResolvedValueOnce(tmdbResponse);
      movieFindSpy.mockReturnValue({ lean: mockLean });
      movieInsertManySpy.mockResolvedValueOnce([
        { ...tmdbResponse.data.results[0], _id: 'new-id' },
      ]);

      await findOrAddMovie(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        total: 1,
        movies: expect.arrayContaining([
          expect.objectContaining({
            title: 'New Movie',
          }),
        ]),
      });
    });

    it('should handle error if TMDB API return empty results', async () => {
      mockRequest.body = { title: 'New Movie' };
      process.env.TMDB_Bearer_Token = 'valid-token';

      const mockLean = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      movieFindSpy.mockReturnValue({ skip: mockSkip });


      axiosGetSpy.mockResolvedValueOnce({
        data: {
          results: []
        }
      });

      await findOrAddMovie(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Movie not found',
      });
    });
  });
});
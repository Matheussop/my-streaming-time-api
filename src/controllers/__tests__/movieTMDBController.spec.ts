import { Request, Response } from 'express';
import { getExternalMovies, fetchAndSaveExternalMovies, findOrAddMovie } from '../movieTMDBController';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/__tests__/generateValidObjectId';
import { IMovieResponse } from '../../interfaces/movie';
import Movie from '../../models/movieModel';

jest.mock('../../services/tmdbService');
jest.mock('../../models/movieModel');

describe('MovieTMDBController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let validId: Types.ObjectId | string;
  let mockMovie: IMovieResponse;
  let originalToken: string | undefined;

  beforeEach(() => {
    originalToken = process.env.TMDB_Bearer_Token;
    process.env.TMDB_Bearer_Token = 'valid-token';

    validId = generateValidObjectId();
    mockMovie = {
      _id: validId as Types.ObjectId,
      title: 'Test Movie',
      genre: [],
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

    mockReq = {
      params: {},
      query: {},
      body: {},
      method: 'GET',
      path: '/tmdb/movies'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(() => mockRes),
      send: jest.fn(),
    };
  });

  afterEach(() => {
    process.env.TMDB_Bearer_Token = originalToken;
  });

  describe('getExternalMovies', () => {
    it('should return external movies from TMDB', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 1,
              title: 'Test Movie',
              release_date: '2024-01-01',
              overview: 'Test plot',
              genre_ids: [1, 2],
              vote_average: 8.5,
              backdrop_path: '/backdrop.jpg',
              poster_path: '/poster.jpg'
            }
          ]
        }
      };

      jest.spyOn(require('axios'), 'get').mockResolvedValue(mockResponse);

      await getExternalMovies(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          title: 'Test Movie',
          year: '2024-01-01',
          plot: 'Test plot',
          genre: [1, 2],
          rating: 8.5,
          poster: expect.stringContaining('https://image.tmdb.org/t/p/original'),
          url: expect.stringContaining('https://image.tmdb.org/t/p/w500')
        })
      ]));
    });

    it('should handle error when TMDB API fails', async () => {
      const error = new Error('API Error');
      jest.spyOn(require('axios'), 'get').mockRejectedValue(error);

      await getExternalMovies(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: error.message });
    });

    it('should handle error when TMDB token is invalid', async () => {
      process.env.TMDB_Bearer_Token = '';

      await getExternalMovies(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'API Error' });
    });
  });

  describe('fetchAndSaveExternalMovies', () => {
    it('should fetch and save new movies from TMDB', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 1,
              title: 'New Movie',
              release_date: '2024-01-01',
              overview: 'New plot',
              genre_ids: [1, 2],
              vote_average: 8.5,
              backdrop_path: '/backdrop.jpg',
              poster_path: '/poster.jpg'
            }, mockMovie // use a same movie to test if it is already in the database
          ]
        }
      };

      jest.spyOn(require('axios'), 'get').mockResolvedValue(mockResponse);
      (Movie.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            title: 'New Movie',
            releaseDate: '2024-01-01',
            plot: 'New plot',
            genre: [1, 2],
            rating: 8.5,
          }
        ]),
      });
      jest.spyOn(Movie, 'insertMany').mockResolvedValue([mockMovie as any]);

      await fetchAndSaveExternalMovies(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith([mockMovie]);
    });

    it('should handle error when saving movies fails', async () => {
      const error = new Error('Database Error');
      jest.spyOn(require('axios'), 'get').mockRejectedValue(error);

      await fetchAndSaveExternalMovies(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: error.message });
    });
  });

  describe('findOrAddMovie', () => {
    it('should find existing movie in database', async () => {
      const searchTitle = 'Existing Movie';
      const page = 1;
      const limit = 10;
      const totalCount = 1;

      mockReq.body = { title: searchTitle, page, limit };

      jest.spyOn(Movie, 'countDocuments').mockResolvedValue(totalCount);
      jest.spyOn(Movie, 'find').mockResolvedValue([mockMovie as any]);
      (Movie.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockMovie as any]),
      });
      
      await findOrAddMovie(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        page,
        limit,
        total: totalCount,
        movies: [mockMovie],
        hasMore: false
      });
    });

    it('should search and add new movie from TMDB when not found in database', async () => {
      const searchTitle = 'New Movie';
      const page = 1;
      const limit = 10;
      const totalCount = 0;

      mockReq.body = { title: searchTitle, page, limit };

      const mockResponse = {
        data: {
          results: [
            {
              id: 1,
              title: searchTitle,
              release_date: '2024-01-01',
              overview: 'New plot',
              genre_ids: [1, 2],
              vote_average: 8.5,
              backdrop_path: '/backdrop.jpg',
              poster_path: '/poster.jpg'
            }
          ]
        }
      };

      jest.spyOn(Movie, 'countDocuments').mockResolvedValue(totalCount);
      jest.spyOn(require('axios'), 'get').mockResolvedValue(mockResponse);
      (Movie.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockMovie as any]),
      });
      jest.spyOn(Movie, 'insertMany').mockResolvedValue([mockMovie as any]);

      await findOrAddMovie(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        page,
        limit,
        total: expect.any(Number),
        movies: [mockMovie],
        hasMore: false
      });
    });

    it('should search and return a existing movie from TMDB when not found in database and in TMDB', async () => {
      const searchTitle = 'New Movie';
      const page = 1;
      const limit = 10;
      const totalCount = 0;

      mockReq.body = { title: searchTitle, page, limit };

      const mockResponse = { data: { results: [ ] } };

      jest.spyOn(Movie, 'countDocuments').mockResolvedValue(totalCount);
      jest.spyOn(require('axios'), 'get').mockResolvedValue(mockResponse);
      (Movie.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockMovie as any]),
      });

      await findOrAddMovie(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        page,
        limit,
        total: 1,
        movies: [mockMovie],
        hasMore: false
      });
      
    });
    
    it("should search and return a new movie without backdrop and poster", async () => {
      const searchTitle = 'New Movie';
      const page = 1;
      const limit = 10;
      const totalCount = 0;

      mockReq.body = { title: searchTitle, page, limit };

      const mockResponse = {
        data: {
          results: [
            {
              id: 1,
              title: searchTitle,
              release_date: '2024-01-01',
              overview: 'New plot',
              genre_ids: [1, 2],
              vote_average: 8.5,
              backdrop_path: null,
              poster_path: null
            }
          ]
        }
      };

      jest.spyOn(Movie, 'countDocuments').mockResolvedValue(totalCount);
      jest.spyOn(require('axios'), 'get').mockResolvedValue(mockResponse);
      (Movie.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockMovie as any]),
      });
      jest.spyOn(Movie, 'insertMany').mockResolvedValue([mockMovie as any]);

      await findOrAddMovie(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        page,
        limit,
        total: totalCount,
        movies: [mockMovie],
        hasMore: false
      });

      
    });
    
    it('should handle error when TMDB API fails', async () => {
      const error = new Error('API Error');
      mockReq.body = { title: 'Test Movie' };

      jest.spyOn(Movie, 'countDocuments').mockResolvedValue(0);
      jest.spyOn(require('axios'), 'get').mockRejectedValue(error);

      await expect(findOrAddMovie(mockReq as Request, mockRes as Response))
        .rejects
        .toThrow('API Error');
    });

    it('should handle error when TMDB token is invalid', async () => {
      process.env.TMDB_Bearer_Token = '';
      mockReq.body = { title: 'Test Movie' };
      
      await expect(findOrAddMovie(mockReq as Request, mockRes as Response))
        .rejects
        .toThrow('Invalid TMDB_Bearer_Token');
    });
  });
});

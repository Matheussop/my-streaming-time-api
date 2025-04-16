import { Types } from "mongoose";
import { IMovieResponse } from "../../interfaces/movie";
import { MovieRepository } from "../../repositories/movieRepository";
import { MovieService } from "../movieService";
import { TMDBService } from "../tmdbService";
import { StreamingServiceError } from "../../middleware/errorHandler";
import { ErrorMessages } from "../../constants/errorMessages";
import { generateValidObjectId } from "../../util/test/generateValidObjectId";
import axios from "axios";
import { IGenreReference } from "../../interfaces/content";

jest.mock('axios');
jest.mock('../tmdbService');

describe('MovieService', () => {
  let movieService: MovieService;
  let mockMovieRepository: jest.Mocked<MovieRepository>;
  let mockTMDBService: jest.Mocked<TMDBService>;

  const mockGenreId = generateValidObjectId() as Types.ObjectId;
  const mockGenreReference: IGenreReference = {
    _id: mockGenreId,
    name: 'Action',
    id: 1,
  };

  const mockMovie: Partial<IMovieResponse> = {
    _id: generateValidObjectId() as Types.ObjectId,
    title: 'Test Movie',
    releaseDate: '2024-03-20',
    plot: 'Test plot',
    cast: ['Actor 1', 'Actor 2'],
    genre: [mockGenreReference],
    rating: 8.5,
    poster: 'http://example.com/poster.jpg',
    url: 'http://example.com/movie.mp4',
    durationTime: 120,
    tmdbId: 12345,
    videoUrl: 'youtube-key',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20')
  };

  const mockTMDBData = {
    runtime: 120,
    videos: {
      results: [
        { type: 'Trailer', key: 'youtube-key' }
      ]
    }
  };

  beforeEach(() => {
    mockMovieRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByTitle: jest.fn(),
      findByGenre: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createManyMovies: jest.fn()
    } as unknown as jest.Mocked<MovieRepository>;

    mockTMDBService = {
      fetchDataFromTMDB: jest.fn(),
      updateData: jest.fn()
    } as unknown as jest.Mocked<TMDBService>;

    movieService = new MovieService(mockTMDBService, mockMovieRepository);
  });

  describe('getMovies', () => {
    it('should return all movies with pagination', async () => {
      mockMovieRepository.findAll.mockResolvedValue([mockMovie as IMovieResponse]);
      const result = await movieService.getMovies(1, 10);
      expect(result).toEqual([mockMovie as IMovieResponse]);
      expect(mockMovieRepository.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('getMovieById', () => {
    it('should return a movie by id', async () => {
      mockMovieRepository.findById.mockResolvedValue(mockMovie as IMovieResponse);
      const result = await movieService.getMovieById(mockMovie._id as unknown as string);
      expect(result).toEqual(mockMovie as IMovieResponse);
      expect(mockMovieRepository.findById).toHaveBeenCalledWith(mockMovie._id);
    });

    it('should throw an error if movie is not found', async () => {
      mockMovieRepository.findById.mockResolvedValue(null);
      await expect(movieService.getMovieById(mockMovie._id as unknown as string))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.MOVIE_NOT_FOUND, 404));
      expect(mockMovieRepository.findById).toHaveBeenCalledWith(mockMovie._id);
    });

    it('should update movie with TMDB data if durationTime is missing', async () => {
      const movieWithoutDuration = { ...mockMovie, durationTime: 0 } as IMovieResponse;
      mockMovieRepository.findById.mockResolvedValue(movieWithoutDuration);
      mockTMDBService.fetchDataFromTMDB.mockResolvedValue(mockTMDBData);
      mockMovieRepository.update.mockResolvedValue(mockMovie as IMovieResponse);

      const result = await movieService.getMovieById(mockMovie._id as unknown as string);
      
      expect(result).toEqual(mockMovie as IMovieResponse);
      expect(mockTMDBService.fetchDataFromTMDB).toHaveBeenCalledWith(mockMovie.tmdbId, "movie");
      expect(mockMovieRepository.update).toHaveBeenCalledWith(
        mockMovie._id,
        expect.objectContaining({
          durationTime: mockTMDBData.runtime,
          videoUrl: mockTMDBData.videos.results[0].key
        })
      );
    });

    it('should be able to return a empty trailer url if no trailer is found', async () => {
      const movieWithoutTrailer = { ...mockMovie, videoUrl: '', durationTime: 0 } as IMovieResponse;
      mockMovieRepository.findById.mockResolvedValue(movieWithoutTrailer);
      const mockTMDBDataWithoutTrailer= { ...mockTMDBData, videos: { results: [] } }
      mockTMDBService.fetchDataFromTMDB.mockResolvedValue(mockTMDBDataWithoutTrailer);
      mockMovieRepository.update.mockResolvedValue(movieWithoutTrailer);

      const result = await movieService.getMovieById(mockMovie._id as unknown as string);

      expect(result).toEqual(movieWithoutTrailer);
      expect(mockTMDBService.fetchDataFromTMDB).toHaveBeenCalledWith(mockMovie.tmdbId, "movie");
      expect(mockMovieRepository.update).toHaveBeenCalledWith(
        mockMovie._id,
        expect.objectContaining({
          videoUrl: ''
        })
      );
    });
  });

  describe('createMovie', () => {
    it('should create a movie with valid data', async () => {
      const movieData = {
        title: 'Test Movie',
        releaseDate: '2024-03-20',
        plot: 'Test plot',
        cast: ['Actor 1', 'Actor 2'],
        genre: [generateValidObjectId()],
        rating: 8.5,
        poster: 'http://example.com/poster.jpg',
        url: 'http://example.com/movie.mp4'
      };

      mockMovieRepository.findByTitle.mockResolvedValue([]);
      mockMovieRepository.create.mockResolvedValue(mockMovie as IMovieResponse);

      const result = await movieService.createMovie(movieData);

      expect(result).toEqual(mockMovie as IMovieResponse);
      expect(mockMovieRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        title: movieData.title.trim(),
        releaseDate: movieData.releaseDate,
        plot: movieData.plot,
        cast: movieData.cast,
        genre: movieData.genre,
        rating: movieData.rating,
        poster: movieData.poster,
        url: movieData.url
      }));
    });

    it('should throw an error if movie with same title exists', async () => {
      const movieData = {
        title: 'Test Movie',
        releaseDate: '2024-03-20',
        plot: 'Test plot',
        cast: ['Actor 1', 'Actor 2'],
        genre: [generateValidObjectId()],
        rating: 8.5,
        poster: 'http://example.com/poster.jpg',
        url: 'http://example.com/movie.mp4'
      };

      mockMovieRepository.findByTitle.mockResolvedValue([mockMovie as IMovieResponse]);

      await expect(movieService.createMovie(movieData))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.MOVIE_WITH_TITLE_EXISTS, 400));
    });
  });

  describe('updateMovie', () => {
    it('should update a movie with valid data', async () => {
      const updateData = {
        title: 'Updated Movie',
        releaseDate: '2024-03-20',
        plot: 'Updated plot',
        cast: ['Actor 1', 'Actor 2'],
        genre: [mockGenreReference],
        url: 'http://example.com/movie.mp4',
        rating: 9.0,
      };

      mockMovieRepository.findById.mockResolvedValue(mockMovie as IMovieResponse);
      mockMovieRepository.findByTitle.mockResolvedValue([]);
      mockMovieRepository.update.mockResolvedValue({ ...mockMovie, ...updateData } as IMovieResponse);

      const result = await movieService.updateMovie(mockMovie._id as unknown as string, updateData);

      expect(result).toEqual({ ...mockMovie, ...updateData } as IMovieResponse);
      expect(mockMovieRepository.update).toHaveBeenCalledWith(
        mockMovie._id,
        expect.objectContaining(updateData)
      );
    });

    it('should throw an error if movie to update is not found', async () => {
      const updateData = {
        title: 'Updated Movie',
        rating: 9.0
      };

      mockMovieRepository.findById.mockResolvedValue(null);

      await expect(movieService.updateMovie(mockMovie._id as unknown as string, updateData))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.MOVIE_NOT_FOUND, 404));
    });

    it('should throw an error if movie with same title exists', async () => {
      const updateData = {
        title: 'Updated Movie',
        rating: 9.0
      };

      mockMovieRepository.findById.mockResolvedValue(mockMovie as IMovieResponse);
      mockMovieRepository.findByTitle.mockResolvedValue([mockMovie as IMovieResponse]);

      await expect(movieService.updateMovie(mockMovie._id as unknown as string, updateData))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.MOVIE_WITH_TITLE_EXISTS, 400));
      expect(mockMovieRepository.findByTitle).toHaveBeenCalledWith(updateData.title, 0, 1);
      expect(mockMovieRepository.update).not.toHaveBeenCalled();
    });

    it('should throw an error if movie with invalid rating is provided', async () => {
      const updateData = {
        rating: 10.5
      };

      mockMovieRepository.findById.mockResolvedValue(mockMovie as IMovieResponse);
      mockMovieRepository.findByTitle.mockResolvedValue([]);
      mockMovieRepository.update.mockResolvedValue(null);

      await expect(movieService.updateMovie(mockMovie._id as unknown as string, updateData))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.MOVIE_RATING_INVALID, 400));
      expect(mockMovieRepository.update).not.toHaveBeenCalled();
    });

    it('should throw an error if movie with invalid release date is provided', async () => {
      const updateData = {
        releaseDate: 'invalid-date'
      };

      mockMovieRepository.findById.mockResolvedValue(mockMovie as IMovieResponse);
      mockMovieRepository.findByTitle.mockResolvedValue([]);
      mockMovieRepository.update.mockResolvedValue(null);

      await expect(movieService.updateMovie(mockMovie._id as unknown as string, updateData))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.MOVIE_RELEASE_DATE_INVALID, 400));
      expect(mockMovieRepository.update).not.toHaveBeenCalled();
    });

    it('should throw an error if movie with future release date is provided', async () => {
      const updateData = {
        releaseDate: new Date(new Date().getTime() + 1000 * 60 * 60 * 24).toISOString()
      };

      mockMovieRepository.findById.mockResolvedValue(mockMovie as IMovieResponse);
      mockMovieRepository.findByTitle.mockResolvedValue([]);
      mockMovieRepository.update.mockResolvedValue(null);

      await expect(movieService.updateMovie(mockMovie._id as unknown as string, updateData))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.MOVIE_RELEASE_DATE_FUTURE, 400));
      expect(mockMovieRepository.update).not.toHaveBeenCalled();
    });

    it('should throw an error if movie has a invalid cast ', async () => {
      const updateData = {
        cast: 'Invalid cast'
      };

      mockMovieRepository.findById.mockResolvedValue(mockMovie as IMovieResponse);
      mockMovieRepository.findByTitle.mockResolvedValue([]);
      mockMovieRepository.update.mockResolvedValue(null);

      await expect(movieService.updateMovie(mockMovie._id as unknown as string, updateData))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.MOVIE_CAST_INVALID, 400));
      expect(mockMovieRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteMovie', () => {
    it('should delete a movie', async () => {
      mockMovieRepository.delete.mockResolvedValue(mockMovie as IMovieResponse);
      const result = await movieService.deleteMovie(mockMovie._id as unknown as string);
      expect(result).toEqual(mockMovie as IMovieResponse);
      expect(mockMovieRepository.delete).toHaveBeenCalledWith(mockMovie._id);
    });

    it('should throw an error if movie to delete is not found', async () => {
      mockMovieRepository.delete.mockResolvedValue(null);
      await expect(movieService.deleteMovie(mockMovie._id as unknown as string))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.MOVIE_NOT_FOUND, 404));
    });
  });

  describe('getMoviesByTitle', () => {
    it('should return movies by title', async () => {
      mockMovieRepository.findByTitle.mockResolvedValue([mockMovie as IMovieResponse]);
      const result = await movieService.getMoviesByTitle('Test Movie', 1, 10);
      expect(result).toEqual([mockMovie as IMovieResponse]);
      expect(mockMovieRepository.findByTitle).toHaveBeenCalledWith('Test Movie', 1, 10);
    });

    it('should throw an error if no movies are found', async () => {
      mockMovieRepository.findByTitle.mockResolvedValue([]);
      await expect(movieService.getMoviesByTitle('Test Movie', 1, 10))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.MOVIES_NOT_FOUND, 404));
    });
  });

  describe('getMoviesByGenre', () => {
    it('should return movies by genre', async () => {
      mockMovieRepository.findByGenre.mockResolvedValue([mockMovie as IMovieResponse]);
      const result = await movieService.getMoviesByGenre('Action', 1, 10);
      expect(result).toEqual([mockMovie as IMovieResponse]);
      expect(mockMovieRepository.findByGenre).toHaveBeenCalledWith('Action', 1, 10);
    });

    it('should throw an error if no movies are found', async () => {
      mockMovieRepository.findByGenre.mockResolvedValue([]);
      await expect(movieService.getMoviesByGenre('Action', 1, 10))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.MOVIES_NOT_FOUND, 404));
    });
  });

  describe('updateMovieFromTMDB', () => {
    it('should update movie with TMDB data', async () => {
      const tmdbId = 12345;
      mockTMDBService.fetchDataFromTMDB.mockResolvedValue(mockTMDBData);
      mockTMDBService.updateData.mockResolvedValue(undefined);

      await movieService.updateMovieFromTMDB(mockMovie._id as unknown as string, tmdbId);

      expect(mockTMDBService.fetchDataFromTMDB).toHaveBeenCalledWith(tmdbId, 'movie');
      expect(mockTMDBService.updateData).toHaveBeenCalledWith(
        mockMovieRepository,
        mockMovie._id,
        mockTMDBData
      );
    });
  });

  describe('fetchAndSaveExternalMovies', () => {
    it('should fetch and save new movies from TMDB', async () => {
      const mockTMDBResponse = {
        data: {
          results: [
            {
              id: 12345,
              title: 'New Movie',
              release_date: '2024-03-20',
              overview: 'New plot',
              genre_ids: [1, 2],
              vote_average: 8.5,
              backdrop_path: '/backdrop.jpg',
              poster_path: '/poster.jpg'
            }
          ]
        }
      };

      (axios.get as jest.Mock).mockResolvedValue(mockTMDBResponse);
      mockMovieRepository.findByTitle.mockResolvedValue([]);
      mockMovieRepository.createManyMovies.mockResolvedValue([mockMovie as IMovieResponse]);

      const result = await movieService.fetchAndSaveExternalMovies();

      expect(result).toEqual([mockMovie as IMovieResponse]);
      expect(mockMovieRepository.createManyMovies).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'New Movie',
            tmdbId: 12345,
            releaseDate: '2024-03-20',
            plot: 'New plot',
            genre: [1, 2],
            rating: 8.5,
            poster: 'https://image.tmdb.org/t/p/original/backdrop.jpg',
            url: 'https://image.tmdb.org/t/p/w500/poster.jpg'
          })
        ])
      );
    });

    it('should not save movies that already exist', async () => {
      const mockTMDBResponse = {
        data: {
          results: [
            {
              id: 12345,
              title: 'Existing Movie',
              release_date: '2024-03-20',
              overview: 'Existing plot',
              genre_ids: [1, 2],
              vote_average: 8.5,
              backdrop_path: '/backdrop.jpg',
              poster_path: '/poster.jpg'
            }
          ]
        }
      };

      (axios.get as jest.Mock).mockResolvedValue(mockTMDBResponse);
      mockMovieRepository.findByTitle.mockResolvedValue([mockMovie as IMovieResponse]);

      const result = await movieService.fetchAndSaveExternalMovies();

      expect(result).toBeUndefined();
      expect(mockMovieRepository.createManyMovies).not.toHaveBeenCalled();
    });
  });
});

import { MovieService } from '../movieService';
import { IMovieRepository, IStreamingTypeRepository } from '../../interfaces/repositories';
import { StreamingServiceError } from '../../middleware/errorHandler';
import { IMovie } from '../../models/movieModel';
import { ErrorMessages } from '../../constants/errorMessages';

describe('MovieService', () => {
  let movieService: MovieService;
  let mockMovieRepository: jest.Mocked<IMovieRepository>;
  let mockStreamingTypeRepository: jest.Mocked<IStreamingTypeRepository>;

  const mockMovie: Partial<IMovie> = {
    _id: '123',
    title: 'Test Movie',
    release_date: '2024-03-20',
    plot: 'Test plot',
    cast: ['Actor 1', 'Actor 2'],
    rating: 8.5,
    genre: [1, 2],
    url: 'http://test.com',
  };

  beforeEach(() => {
    mockMovieRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByGenre: jest.fn(),
      findByTitle: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IMovieRepository>;

    mockStreamingTypeRepository = {
      getIdGenreByName: jest.fn(),
    } as unknown as jest.Mocked<IStreamingTypeRepository>;

    movieService = new MovieService(mockMovieRepository, mockStreamingTypeRepository);
  });

  describe('getMovies', () => {
    it('should return all movies', async () => {
      mockMovieRepository.findAll.mockResolvedValue([mockMovie as IMovie]);

      const result = await movieService.getMovies(0, 1);

      expect(result).toEqual([mockMovie]);
      expect(mockMovieRepository.findAll).toHaveBeenCalledWith(0, 1);
    });
  });

  describe('createMovie', () => {
    it('should create a movie with valid data', async () => {
      const movieData: Partial<IMovie> = { ...mockMovie };
      delete movieData._id; // Remove _id for creation

      mockMovieRepository.findByTitle.mockResolvedValue(null);
      mockMovieRepository.create.mockResolvedValue(mockMovie as IMovie);

      const result = await movieService.createMovie(movieData);

      expect(result).toBeDefined();
      expect(result.title).toBe(movieData.title);
      expect(mockMovieRepository.create).toHaveBeenCalledWith(movieData);
    });

    it('should throw error if movie title already exists', async () => {
      const movieData: Partial<IMovie> = {
        title: 'Existing Movie',
        release_date: '2024-03-20',
        rating: 8.5,
        genre: [1],
        url: 'http://test.com',
      };

      mockMovieRepository.findByTitle.mockResolvedValue([mockMovie as IMovie]);

      await expect(movieService.createMovie(movieData)).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.MOVIE_WITH_TITLE_EXISTS, 400),
      );
    });

    it('should throw error if required fields are missing', async () => {
      const invalidMovieData: Partial<IMovie> = {
        title: 'Test Movie',
      };

      await expect(movieService.createMovie(invalidMovieData)).rejects.toThrow(StreamingServiceError);
    });
  });

  describe('getMovieById', () => {
    it('should return movie if found', async () => {
      mockMovieRepository.findById.mockResolvedValue(mockMovie as IMovie);

      const result = await movieService.getMovieById('123');

      expect(result).toEqual(mockMovie);
      expect(mockMovieRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should throw error if movie not found', async () => {
      mockMovieRepository.findById.mockResolvedValue(null);

      await expect(movieService.getMovieById('999')).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.MOVIE_NOT_FOUND, 404),
      );
    });
  });

  describe('getMoviesByGenre', () => {
    it('should return movie if found', async () => {
      mockStreamingTypeRepository.getIdGenreByName.mockResolvedValue(1);
      mockMovieRepository.findByGenre.mockResolvedValue([mockMovie as IMovie]);

      const result = await movieService.getMoviesByGenre('action', 0, 10);

      expect(result).toEqual([mockMovie]);
      expect(mockMovieRepository.findByGenre).toHaveBeenCalledWith('action', 0, 10);
    });

    it('should throw error if movie not found', async () => {
      mockStreamingTypeRepository.getIdGenreByName.mockResolvedValue(1);

      mockMovieRepository.findByGenre.mockResolvedValue([]);

      await expect(movieService.getMoviesByGenre('action', 0, 10)).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.MOVIES_NOT_FOUND, 404),
      );
    });
  });

  describe('updateMovie', () => {
    it('should update movie with valid data', async () => {
      const updateData: Partial<IMovie> = {
        title: 'Movie Title',
        rating: 9.0,
        release_date: '2024-03-20',
        cast: ['Actor 1', 'Actor 2'],
        genre: [1, 2],
        url: 'http://test.com',
        plot: 'Test plot',
      };

      mockMovieRepository.findById.mockResolvedValue(mockMovie as IMovie);
      mockMovieRepository.update.mockResolvedValue({ ...mockMovie, ...updateData } as IMovie);

      const result = await movieService.updateMovie('123', updateData);

      expect(result?.title).toBe(updateData.title);
      expect(result?.rating).toBe(updateData.rating);
      expect(result?.release_date).toBe(mockMovie.release_date);
      expect(result?.cast).toEqual(mockMovie.cast);
      expect(result?.genre).toEqual(mockMovie.genre);
      expect(result?.plot).toBe(mockMovie.plot);
      expect(mockMovieRepository.update).toHaveBeenCalledWith('123', updateData);
    });

    it('should throw error if movie not found for update', async () => {
      mockMovieRepository.findById.mockResolvedValue(null);

      await expect(movieService.updateMovie('999', { title: 'Updated Title' })).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.MOVIE_NOT_FOUND, 404),
      );
    });

    it('should throw error if movie title is duplicated for update', async () => {
      const existingMovie: Partial<IMovie> = {
        title: 'Test Movie Fixed',
        ...mockMovie,
      };
      mockMovieRepository.findById.mockResolvedValue(existingMovie as IMovie);
      mockMovieRepository.findByTitle.mockResolvedValue([existingMovie as IMovie]);

      await expect(movieService.updateMovie('999', { title: 'Updated Title' })).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.MOVIE_WITH_TITLE_EXISTS, 400),
      );
    });

    it('should throw error if movie rating is not a number between 0 and 10 for update', async () => {
      mockMovieRepository.findById.mockResolvedValue(mockMovie as IMovie);

      await expect(movieService.updateMovie('999', { rating: '11' })).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.MOVIE_RATING_INVALID, 400),
      );
    });

    it('should throw error if movie release date is in the future for update', async () => {
      mockMovieRepository.findById.mockResolvedValue(mockMovie as IMovie);

      const releaseDate = new Date();
      releaseDate.setFullYear(releaseDate.getFullYear() + 1);
      await expect(movieService.updateMovie('999', { release_date: releaseDate.toISOString() })).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.MOVIE_RELEASE_DATE_FUTURE, 400),
      );
    });

    it('should throw error if movie release date is wrong for update', async () => {
      mockMovieRepository.findById.mockResolvedValue(mockMovie as IMovie);

      await expect(movieService.updateMovie('999', { release_date: '2024-20-20' })).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.MOVIE_RELEASE_DATE_INVALID, 400),
      );
    });

    it('should throw error if movie cast is not an array for update', async () => {
      mockMovieRepository.findById.mockResolvedValue(mockMovie as IMovie);

      await expect(movieService.updateMovie('999', { cast: 'Actor 1' })).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.MOVIE_CAST_INVALID, 400),
      );
    });
  });

  describe('deleteMovie', () => {
    it('should delete a movie', async () => {
      mockMovieRepository.findById.mockResolvedValue(mockMovie as IMovie);
      mockMovieRepository.delete.mockResolvedValue(mockMovie as IMovie);

      const result = await movieService.deleteMovie('123');

      expect(result).toBe(mockMovie);
      expect(mockMovieRepository.delete).toHaveBeenCalledWith('123');
    });

    it('should throw error if movie not found for deletion', async () => {
      mockMovieRepository.findById.mockResolvedValue(null);

      await expect(movieService.deleteMovie('999')).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.MOVIE_NOT_FOUND, 404),
      );
    });
  });

  describe('getMoviesByTitle', () => {
    it('should return movies if found', async () => {
      mockMovieRepository.findByTitle.mockResolvedValue([mockMovie as IMovie]);

      const result = await movieService.getMoviesByTitle('Test Movie', 0, 1);

      expect(result).toEqual([mockMovie]);
      expect(mockMovieRepository.findByTitle).toHaveBeenCalledWith('Test Movie', 0, 1);
    });

    it('should throw error if movie not found', async () => {
      mockMovieRepository.findByTitle.mockResolvedValue([]);

      await expect(movieService.getMoviesByTitle('Test Movie', 0, 10)).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.MOVIES_NOT_FOUND, 404),
      );
    });
  });
});

import { Types } from "mongoose";
import { IGenreCreate, IGenreResponse, IGenreUpdate } from "../../interfaces/genres";
import { GenreRepository } from "../../repositories/genreRepository";
import { GenreService } from "../genreService";
import { StreamingServiceError } from "../../middleware/errorHandler";
import { ErrorMessages } from "../../constants/errorMessages";
import { generateValidObjectId } from "../../util/__tests__/generateValidObjectId";
import { TMDBService } from "../tmdbService";

describe('GenreService', () => {
  let genreService: GenreService;
  let mockGenreRepository: jest.Mocked<GenreRepository>;
  let mockTMDBService: jest.Mocked<TMDBService>;

  const mockGenre: Partial<IGenreResponse> = {
    _id: generateValidObjectId() as Types.ObjectId,
    name: 'Action',
    id: 1,
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20')
  };

  beforeEach(() => {
    mockGenreRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<GenreRepository>;

    mockTMDBService = {
      fetchMovieGenres: jest.fn(),
      fetchTVGenres: jest.fn()
    } as unknown as jest.Mocked<TMDBService>;

    genreService = new GenreService(mockGenreRepository, mockTMDBService);
  });

  describe('getGenreById', () => {
    it('should return a genre by id', async () => {
      mockGenreRepository.findById.mockResolvedValue(mockGenre as IGenreResponse);
      const result = await genreService.getGenreById(mockGenre._id as unknown as string);
      expect(result).toEqual(mockGenre as IGenreResponse);
      expect(mockGenreRepository.findById).toHaveBeenCalledWith(mockGenre._id);
    });

    it('should throw an error if genre is not found', async () => {
      mockGenreRepository.findById.mockResolvedValue(null);
      await expect(genreService.getGenreById(mockGenre._id as unknown as string))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.GENRE_NOT_FOUND, 404));
      expect(mockGenreRepository.findById).toHaveBeenCalledWith(mockGenre._id);
    });
  });

  describe('getGenreByName', () => {
    it('should return a genre by name', async () => {
      mockGenreRepository.findByName.mockResolvedValue(mockGenre as IGenreResponse);
      const result = await genreService.getGenreByName('Action');
      expect(result).toEqual(mockGenre as IGenreResponse);
      expect(mockGenreRepository.findByName).toHaveBeenCalledWith('Action');
    });

    it('should throw an error if genre is not found', async () => {
      mockGenreRepository.findByName.mockResolvedValue(null);
      await expect(genreService.getGenreByName('Action'))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.GENRE_NOT_FOUND, 404));
      expect(mockGenreRepository.findByName).toHaveBeenCalledWith('Action');
    });
  });

  describe('getAllGenres', () => {
    it('should return all genres with pagination', async () => {
      mockGenreRepository.findAll.mockResolvedValue([mockGenre as IGenreResponse]);
      const result = await genreService.getAllGenres(1, 10);
      expect(result).toEqual([mockGenre as IGenreResponse]);
      expect(mockGenreRepository.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('createGenre', () => {
    it('should create a single genre', async () => {
      const genreCreate: IGenreCreate = {
        name: 'Action',
        id: 1
      };
      mockGenreRepository.create.mockResolvedValue(mockGenre as IGenreResponse);
      const result = await genreService.createGenre(genreCreate);
      expect(result).toEqual(mockGenre as IGenreResponse);
      expect(mockGenreRepository.create).toHaveBeenCalledWith(genreCreate);
    });

    it('should create multiple genres', async () => {
      const genresCreate: IGenreCreate[] = [
        { name: 'Action', id: 1 },
        { name: 'Comedy', id: 2 }
      ];
      const mockGenres = [
        { ...mockGenre, name: 'Action' },
        { ...mockGenre, name: 'Comedy' }
      ];
      mockGenreRepository.create.mockResolvedValue(mockGenres as IGenreResponse[]);
      const result = await genreService.createGenre(genresCreate);
      expect(result).toEqual(mockGenres as IGenreResponse[]);
      expect(mockGenreRepository.create).toHaveBeenCalledWith(genresCreate);
    });
  });

  describe('updateGenre', () => {
    it('should update a genre', async () => {
      const genreUpdate: IGenreUpdate = {
        name: 'Updated Action'
      };
      const updatedGenre = { ...mockGenre, name: 'Updated Action' };
      mockGenreRepository.update.mockResolvedValue(updatedGenre as IGenreResponse);
      const result = await genreService.updateGenre(mockGenre._id as unknown as string, genreUpdate);
      expect(result).toEqual(updatedGenre as IGenreResponse);
      expect(mockGenreRepository.update).toHaveBeenCalledWith(mockGenre._id, genreUpdate);
    });
  });

  describe('deleteGenre', () => {
    it('should delete a genre', async () => {
      mockGenreRepository.delete.mockResolvedValue(mockGenre as IGenreResponse);
      const result = await genreService.deleteGenre(mockGenre._id as unknown as string);
      expect(result).toEqual(mockGenre as IGenreResponse);
      expect(mockGenreRepository.delete).toHaveBeenCalledWith(mockGenre._id);
    });
  });

  describe('syncGenresFromTMDB', () => {
    it('should sync genres from TMDB successfully', async () => {
      const mockMovieGenres = [
        { id: 1, name: 'Action' },
        { id: 2, name: 'Comedy' }
      ];
      const mockTVGenres = [
        { id: 3, name: 'Drama' },
        { id: 4, name: 'Thriller' }
      ];

      mockTMDBService.fetchMovieGenres.mockResolvedValue(mockMovieGenres);
      mockTMDBService.fetchTVGenres.mockResolvedValue(mockTVGenres);
      mockGenreRepository.findAll.mockResolvedValue([]); // No existing genres
      mockGenreRepository.create.mockResolvedValue([]);

      const result = await genreService.syncGenresFromTMDB();

      expect(result).toEqual({
        movieGenres: 2,
        tvGenres: 2
      });
      expect(mockTMDBService.fetchMovieGenres).toHaveBeenCalled();
      expect(mockTMDBService.fetchTVGenres).toHaveBeenCalled();
      expect(mockGenreRepository.create).toHaveBeenCalledWith([
        { id: 1, name: 'Action', poster: '' },
        { id: 2, name: 'Comedy', poster: '' },
        { id: 3, name: 'Drama', poster: '' },
        { id: 4, name: 'Thriller', poster: '' }
      ]);
    });

    it('should not create genres if they already exist', async () => {
      const mockMovieGenres = [
        { id: 1, name: 'Action' }
      ];
      const mockTVGenres = [
        { id: 2, name: 'Comedy' }
      ];

      mockTMDBService.fetchMovieGenres.mockResolvedValue(mockMovieGenres);
      mockTMDBService.fetchTVGenres.mockResolvedValue(mockTVGenres);
      mockGenreRepository.findAll.mockResolvedValue([
        { id: 1, name: 'Action' } as IGenreResponse
      ]); // Existing genre

      const result = await genreService.syncGenresFromTMDB();

      expect(result).toEqual({
        movieGenres: 1,
        tvGenres: 1
      });
      expect(mockGenreRepository.create).toHaveBeenCalledWith([
        { id: 2, name: 'Comedy', poster: '' }
      ]);
    });

    it('should throw error if TMDBService is not available', async () => {
      const genreServiceWithoutTMDB = new GenreService(mockGenreRepository);

      await expect(genreServiceWithoutTMDB.syncGenresFromTMDB())
        .rejects.toThrow(new StreamingServiceError('TMDBService not available', 500));
    });

    it('should handle TMDB API errors', async () => {
      mockTMDBService.fetchMovieGenres.mockRejectedValue(new Error('TMDB API Error'));

      await expect(genreService.syncGenresFromTMDB())
        .rejects.toThrow(new StreamingServiceError('Error synchronizing genres from TMDB', 500));
    });
  });
});
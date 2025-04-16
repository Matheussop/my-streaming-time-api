import { Types } from "mongoose";
import { IGenreCreate, IGenreResponse, IGenreUpdate } from "../../interfaces/genres";
import { GenreRepository } from "../../repositories/genreRepository";
import { GenreService } from "../genreService";
import { StreamingServiceError } from "../../middleware/errorHandler";
import { ErrorMessages } from "../../constants/errorMessages";
import { generateValidObjectId } from "../../util/test/generateValidObjectId";

describe('GenreService', () => {
  let genreService: GenreService;
  let mockGenreRepository: jest.Mocked<GenreRepository>;

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

    genreService = new GenreService(mockGenreRepository);
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

    it('should throw an error if genre cannot be created', async () => {
      const genreCreate: IGenreCreate = {
        name: 'Action',
        id: 1
      };
      mockGenreRepository.create.mockResolvedValue(undefined as unknown as IGenreResponse);
      await expect(genreService.createGenre(genreCreate))
        .rejects.toThrow(new StreamingServiceError("Genre cannot be created", 404));
      expect(mockGenreRepository.create).toHaveBeenCalledWith(genreCreate);
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

    it('should throw an error if genre cannot be found for update', async () => {
      const genreUpdate: IGenreUpdate = {
        name: 'Updated Action'
      };
      mockGenreRepository.update.mockResolvedValue(null);
      await expect(genreService.updateGenre(mockGenre._id as unknown as string, genreUpdate))
        .rejects.toThrow(new StreamingServiceError("Genre cannot be found", 404));
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

    it('should throw an error if genre cannot be deleted', async () => {
      mockGenreRepository.delete.mockResolvedValue(null);
      await expect(genreService.deleteGenre(mockGenre._id as unknown as string))
        .rejects.toThrow(new StreamingServiceError("Genre cannot be deleted", 404));
      expect(mockGenreRepository.delete).toHaveBeenCalledWith(mockGenre._id);
    });
  });
}); 
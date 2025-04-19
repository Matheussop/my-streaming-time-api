import { Types } from 'mongoose';
import { GenreRepository } from '../genreRepository';
import Genre from '../../models/genresModel';
import { IGenreResponse, IGenreCreate, IGenreUpdate } from '../../interfaces/genres';

jest.mock('../../models/genresModel');

describe('GenreRepository', () => {
  let genreRepository: GenreRepository;
  let mockGenre: IGenreResponse;
  let mockGenres: IGenreResponse[];

  beforeEach(() => {
    genreRepository = new GenreRepository();
    mockGenre = {
      _id: new Types.ObjectId(),
      name: 'Action',
      id: 1,
      poster: 'poster.jpg',
      createdAt: new Date('2024-03-20T00:00:00.000Z'),
      updatedAt: new Date('2024-03-20T00:00:00.000Z')
    } as IGenreResponse;

    mockGenres = [
      mockGenre,
      {
        ...mockGenre,
        _id: new Types.ObjectId(),
        name: 'Comedy',
        id: 2
      }
    ];

    (Genre.findByName as jest.Mock).mockClear();
    (Genre.find as jest.Mock).mockClear();
    (Genre.findById as jest.Mock).mockClear();
    (Genre.create as jest.Mock).mockClear();
    (Genre.findOneAndUpdate as jest.Mock).mockClear();
    (Genre.findByIdAndDelete as jest.Mock).mockClear();
  });

  describe('findByName', () => {
    it('should return genre by name', async () => {
      (Genre.findByName as jest.Mock).mockResolvedValue(mockGenre);

      const result = await genreRepository.findByName(mockGenre.name);

      expect(Genre.findByName).toHaveBeenCalledWith(mockGenre.name);
      expect(result).toEqual(mockGenre);
    });

    it('should return null if genre not found', async () => {
      (Genre.findByName as jest.Mock).mockResolvedValue(null);

      const result = await genreRepository.findByName(mockGenre.name);

      expect(Genre.findByName).toHaveBeenCalledWith(mockGenre.name);
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all genres with pagination', async () => {
      (Genre.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockGenres)
        })
      });

      const result = await genreRepository.findAll(0, 10);

      expect(Genre.find).toHaveBeenCalled();
      expect(result).toEqual(mockGenres);
    });
  });

  describe('findById', () => {
    it('should return genre by id', async () => {
      (Genre.findById as jest.Mock).mockResolvedValue(mockGenre);

      const result = await genreRepository.findById(mockGenre._id.toString());

      expect(Genre.findById).toHaveBeenCalledWith(mockGenre._id.toString());
      expect(result).toEqual(mockGenre);
    });

    it('should return null if genre not found', async () => {
      (Genre.findById as jest.Mock).mockResolvedValue(null);

      const result = await genreRepository.findById(mockGenre._id.toString());

      expect(Genre.findById).toHaveBeenCalledWith(mockGenre._id.toString());
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new genre', async () => {
      const genreData: Partial<IGenreCreate> = {
        name: 'Action',
        id: 1,
        poster: 'poster.jpg'
      };

      (Genre.create as jest.Mock).mockResolvedValue(mockGenre);

      const result = await genreRepository.create(genreData);

      expect(Genre.create).toHaveBeenCalledWith(genreData);
      expect(result).toEqual(mockGenre);
    });

    it('should create multiple genres', async () => {
      const genresData: Partial<IGenreCreate>[] = [
        {
          name: 'Action',
          id: 1,
          poster: 'poster.jpg'
        },
        {
          name: 'Comedy',
          id: 2,
          poster: 'poster.jpg'
        }
      ];

      (Genre.create as jest.Mock).mockResolvedValue(mockGenres);

      const result = await genreRepository.create(genresData);

      expect(Genre.create).toHaveBeenCalledWith(genresData);
      expect(result).toEqual(mockGenres);
    });
  });

  describe('update', () => {
    it('should update genre', async () => {
      const updateData: Partial<IGenreUpdate> = {
        name: 'Updated Action',
        poster: 'new-poster.jpg'
      };

      (Genre.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ...mockGenre,
        ...updateData
      });

      const result = await genreRepository.update(mockGenre._id.toString(), updateData);

      expect(Genre.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockGenre._id.toString() },
        { $set: updateData },
        { new: true, runValidators: true }
      );
      expect(result).toEqual({
        ...mockGenre,
        ...updateData
      });
    });

    it('should return null if genre not found', async () => {
      const updateData: Partial<IGenreUpdate> = {
        name: 'Updated Action'
      };

      (Genre.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await genreRepository.update(mockGenre._id.toString(), updateData);

      expect(Genre.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockGenre._id.toString() },
        { $set: updateData },
        { new: true, runValidators: true }
      );
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete genre', async () => {
      (Genre.findByIdAndDelete as jest.Mock).mockResolvedValue(mockGenre);

      const result = await genreRepository.delete(mockGenre._id.toString());

      expect(Genre.findByIdAndDelete).toHaveBeenCalledWith(mockGenre._id.toString());
      expect(result).toEqual(mockGenre);
    });

    it('should return null if genre not found', async () => {
      (Genre.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const result = await genreRepository.delete(mockGenre._id.toString());

      expect(Genre.findByIdAndDelete).toHaveBeenCalledWith(mockGenre._id.toString());
      expect(result).toBeNull();
    });
  });
}); 
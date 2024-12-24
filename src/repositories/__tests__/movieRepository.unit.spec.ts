import { MovieRepository } from '../movieRepository';
import Movie, { IMovie } from '../../models/movieModel';
import mongoose from 'mongoose';

jest.mock('../../models/movieModel');

describe('MovieRepository Unit Tests', () => {
  let movieRepository: MovieRepository;
  const mockMovie = {
    _id: new mongoose.Types.ObjectId().toString(),
    title: 'Test Movie',
    release_date: '2024-03-20',
    plot: 'Test plot',
    genre: [1, 2],
    rating: 8.5,
    url: 'http://test.com'
  };

  const mockSaveMovie = jest.fn().mockResolvedValue(mockMovie);
  (Movie as unknown as jest.Mock).mockImplementation(() => ({
    save: mockSaveMovie,
  }));

  beforeEach(() => {
    movieRepository = new MovieRepository();
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all movies with pagination', async () => {
      const mockMovies = [mockMovie, { ...mockMovie, _id: new mongoose.Types.ObjectId() }];

      const findSpy = jest.spyOn(Movie, 'find').mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockMovies),
      } as any);

      const result = await movieRepository.findAll(0, 10);

      expect(findSpy).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('title', 'Test Movie');
    });

    it('should apply correct pagination parameters', async () => {
      const skip = 10;
      const limit = 5;

      const findSpy = jest.spyOn(Movie, 'find').mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      } as any);

      await movieRepository.findAll(skip, limit);

      const mockFind = findSpy.mock.results[0].value;
      expect(mockFind.skip).toHaveBeenCalledWith(skip);
      expect(mockFind.limit).toHaveBeenCalledWith(limit);
    });
  });

  describe('findById', () => {
    it('should find movie by id', async () => {
      const findByIdSpy = jest.spyOn(Movie, 'findById').mockResolvedValue(mockMovie)

      const result = await movieRepository.findById(mockMovie._id.toString());

      expect(findByIdSpy).toHaveBeenCalledWith(mockMovie._id.toString());
      expect(result).toEqual(mockMovie);
    });

    it('should return null for non-existent movie', async () => {
      const findByIdSpy = jest.spyOn(Movie, 'findById').mockResolvedValue(null)

      const result = await movieRepository.findById('nonexistent-id');

      expect(findByIdSpy).toHaveBeenCalledWith('nonexistent-id');
      expect(result).toBeNull();
    });
  });

  describe('findByTitle', () => {
    it('should find movies by title', async () => {
      const findSpy = jest.spyOn(Movie, 'findByTitle').mockResolvedValue([mockMovie] as IMovie[])

      const result = await movieRepository.findByTitle('Test', 0, 10);

      expect(findSpy).toHaveBeenCalledWith('Test', 0, 10 );
      expect(result).toHaveLength(1);
      expect(result?.[0]?.title).toBe('Test Movie');
    });
  });

  describe('create', () => {
    it('should create a new movie', async () => {
      mockSaveMovie.mockResolvedValue(mockMovie);

      const result = await movieRepository.create(mockMovie);

      expect(mockSaveMovie).toHaveBeenCalled();
      expect(result).toEqual(mockMovie);
    });
  });

  describe('update', () => {
    it('should update an existing movie', async () => {
      const updateData = { title: 'Updated Movie' };
      const updatedMovie = { ...mockMovie, ...updateData };

      const findByIdAndUpdateSpy = jest.spyOn(Movie, 'findByIdAndUpdate').mockResolvedValue(updatedMovie)
      const result = await movieRepository.update(mockMovie._id.toString(), updateData);

      expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(
        mockMovie._id.toString(),
        { $set: updateData },
        { new: true, runValidators: true }
      );
      expect(result).toEqual(updatedMovie);
    });

    it('should return null when updating non-existent movie', async () => {
      const findByIdAndUpdateSpy = jest.spyOn(Movie, 'findByIdAndUpdate').mockResolvedValue(null)

      const result = await movieRepository.update('nonexistent-id', { title: 'Updated' });

      expect(findByIdAndUpdateSpy).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing movie', async () => {
      const findByIdAndDeleteSpy = jest.spyOn(Movie, 'findByIdAndDelete')
        .mockResolvedValue(mockMovie);

      const result = await movieRepository.delete(mockMovie._id.toString());

      expect(findByIdAndDeleteSpy).toHaveBeenCalledWith(mockMovie._id.toString());
      expect(result).toEqual(mockMovie);
    });

    it('should return null when deleting non-existent movie', async () => {
      const findByIdAndDeleteSpy = jest.spyOn(Movie, 'findByIdAndDelete')
        .mockResolvedValue(null);

      const result = await movieRepository.delete('nonexistent-id');

      expect(findByIdAndDeleteSpy).toHaveBeenCalledWith('nonexistent-id');
      expect(result).toBeNull();
    });
  });
}); 
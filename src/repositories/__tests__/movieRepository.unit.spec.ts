import { Types } from 'mongoose';
import { MovieRepository } from '../movieRepository';
import Movie from '../../models/movieModel';
import { IMovieResponse } from '../../interfaces/movie';
import { IContentModel } from '../../interfaces/content';
import { IGenreReference } from '../../interfaces/streamingTypes';

jest.mock('../../models/movieModel');

describe('MovieRepository', () => {
  let movieRepository: MovieRepository;
  let mockMovie: IMovieResponse;
  let mockMovies: IMovieResponse[];
  let mockGenre: IGenreReference;

  beforeEach(() => {
    movieRepository = new MovieRepository();
    mockGenre = {
      _id: new Types.ObjectId(),
      name: 'Action',
      id: 1,
      poster: 'poster.jpg'
    };

    mockMovie = {
      _id: new Types.ObjectId(),
      title: 'Test Movie',
      contentType: 'movie',
      durationTime: 120,
      releaseDate: '2024-03-20T00:00:00.000Z',
      plot: 'Test plot',
      cast: ['Actor 1', 'Actor 2'],
      genre: [mockGenre],
      rating: 8.5,
      poster: 'poster.jpg',
      url: 'movie.mp4',
      createdAt: new Date('2024-03-20T00:00:00.000Z'),
      updatedAt: new Date('2024-03-20T00:00:00.000Z')
    } as IMovieResponse;

    mockMovies = [
      mockMovie,
      {
        ...mockMovie,
        _id: new Types.ObjectId(),
        title: 'Test Movie 2'
      }
    ];

    (Movie.find as jest.Mock).mockClear();
    (Movie.findById as jest.Mock).mockClear();
    (Movie.create as jest.Mock).mockClear();
    (Movie.insertMany as jest.Mock).mockClear();
    (Movie.findByIdAndUpdate as jest.Mock).mockClear();
    (Movie.findByIdAndDelete as jest.Mock).mockClear();
    ((Movie as unknown as IContentModel).findByTitle as jest.Mock).mockClear();
    ((Movie as unknown as IContentModel).findByGenre as jest.Mock).mockClear();
  });

  describe('findAll', () => {
    it('should return all movies with pagination', async () => {
      (Movie.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockMovies)
          })
        })
      });

      const result = await movieRepository.findAll(0, 10);

      expect(Movie.find).toHaveBeenCalled();
      expect(result).toEqual(mockMovies);
    });
  });

  describe('findById', () => {
    it('should return movie by id', async () => {
      (Movie.findById as jest.Mock).mockResolvedValue(mockMovie);

      const result = await movieRepository.findById(mockMovie._id.toString());

      expect(Movie.findById).toHaveBeenCalledWith(mockMovie._id.toString());
      expect(result).toEqual(mockMovie);
    });

    it('should return null if movie not found', async () => {
      (Movie.findById as jest.Mock).mockResolvedValue(null);

      const result = await movieRepository.findById(mockMovie._id.toString());

      expect(Movie.findById).toHaveBeenCalledWith(mockMovie._id.toString());
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new movie', async () => {
      (Movie.create as jest.Mock).mockResolvedValue(mockMovie);

      const result = await movieRepository.create(mockMovie);

      expect(Movie.create).toHaveBeenCalledWith(mockMovie);
      expect(result).toEqual(mockMovie);
    });

    it('should create multiple movies', async () => {
      (Movie.create as jest.Mock).mockResolvedValue(mockMovies);

      const result = await movieRepository.create(mockMovies);

      expect(Movie.create).toHaveBeenCalledWith(mockMovies);
      expect(result).toEqual(mockMovies);
    });
  });

  describe('createManyMovies', () => {
    it('should create multiple movies', async () => {
      (Movie.insertMany as jest.Mock).mockResolvedValue(mockMovies);

      const result = await movieRepository.createManyMovies(mockMovies);

      expect(Movie.insertMany).toHaveBeenCalledWith(mockMovies);
      expect(result).toEqual(mockMovies);
    });
  });

  describe('update', () => {
    it('should update movie', async () => {
      (Movie.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockMovie);

      const result = await movieRepository.update(mockMovie._id.toString(), mockMovie);

      expect(Movie.findByIdAndUpdate).toHaveBeenCalledWith(
        mockMovie._id.toString(),
        { $set: mockMovie },
        { new: true, runValidators: true }
      );
      expect(result).toEqual(mockMovie);
    });

    it('should return null if movie not found', async () => {
      (Movie.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await movieRepository.update(mockMovie._id.toString(), mockMovie);

      expect(Movie.findByIdAndUpdate).toHaveBeenCalledWith(
        mockMovie._id.toString(),
        { $set: mockMovie },
        { new: true, runValidators: true }
      );
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete movie', async () => {
      (Movie.findByIdAndDelete as jest.Mock).mockResolvedValue(mockMovie);

      const result = await movieRepository.delete(mockMovie._id.toString());

      expect(Movie.findByIdAndDelete).toHaveBeenCalledWith(mockMovie._id.toString());
      expect(result).toEqual(mockMovie);
    });

    it('should return null if movie not found', async () => {
      (Movie.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const result = await movieRepository.delete(mockMovie._id.toString());

      expect(Movie.findByIdAndDelete).toHaveBeenCalledWith(mockMovie._id.toString());
      expect(result).toBeNull();
    });
  });

  describe('findByTitle', () => {
    it('should return movies by title with pagination', async () => {
      ((Movie as unknown as IContentModel).findByTitle as jest.Mock).mockResolvedValue(mockMovies);

      const result = await movieRepository.findByTitle('Test', 0, 10);

      expect((Movie as unknown as IContentModel).findByTitle).toHaveBeenCalledWith('Test', 0, 10);
      expect(result).toEqual(mockMovies);
    });

    it('should return null if no movies found', async () => {
      ((Movie as unknown as IContentModel).findByTitle as jest.Mock).mockResolvedValue(null);

      const result = await movieRepository.findByTitle('Test', 0, 10);

      expect((Movie as unknown as IContentModel).findByTitle).toHaveBeenCalledWith('Test', 0, 10);
      expect(result).toBeNull();
    });
  });

  describe('findByGenre', () => {
    it('should return movies by genre with pagination', async () => {
      ((Movie as unknown as IContentModel).findByGenre as jest.Mock).mockResolvedValue(mockMovies);

      const result = await movieRepository.findByGenre('Action', 0, 10);

      expect((Movie as unknown as IContentModel).findByGenre).toHaveBeenCalledWith('Action', 0, 10);
      expect(result).toEqual(mockMovies);
    });

    it('should return null if no movies found', async () => {
      ((Movie as unknown as IContentModel).findByGenre as jest.Mock).mockResolvedValue(null);

      const result = await movieRepository.findByGenre('Action', 0, 10);

      expect((Movie as unknown as IContentModel).findByGenre).toHaveBeenCalledWith('Action', 0, 10);
      expect(result).toBeNull();
    });
  });
});

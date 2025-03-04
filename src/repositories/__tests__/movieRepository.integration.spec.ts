import { connect, closeDatabase, clearSpecificDatabase } from './mongooseSetup';
import { MovieRepository } from '../movieRepository';
import { IMovie } from '../../models/movieModel';
import { IStreamingTypeResponse } from '../../interfaces/streamingTypes';
import { StreamingTypeRepository } from '../streamingTypeRepository';

describe('MovieRepository Integration Tests', () => {
  let movieRepository: MovieRepository;
  let categoriesIds: number[] = [];
  beforeAll(async () => {
    await connect();
    movieRepository = new MovieRepository();
    const newStreamingTypeData: IStreamingTypeResponse = {
      name: 'Disney+',
      categories: [
        { id: 1, name: 'Series' },
        { id: 2, name: 'Movies' },
      ],
    } as unknown as IStreamingTypeResponse;

    const streamingType = await createStreamingType(newStreamingTypeData);
    categoriesIds = streamingType.categories.map((category) => category.id);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearSpecificDatabase('movies');
  });

  const createStreamingType = async (streamingTypeObj: IStreamingTypeResponse): Promise<IStreamingTypeResponse> => {
    const streamingTypeRepository = new StreamingTypeRepository();
    return await streamingTypeRepository.create(streamingTypeObj);
  };

  it('should create a new movie', async () => {
    const movieData: Partial<IMovie> = {
      title: 'Test Movie',
      releaseDate: '2024-03-20',
      plot: 'Test plot',
      genre: categoriesIds,
      rating: 8.5,
      url: 'http://test.com',
    };

    const createdMovie = await movieRepository.create(movieData);
    expect(createdMovie).toHaveProperty('_id');
    expect(createdMovie.title).toBe(movieData.title);
  });

  it('should find a movie by id', async () => {
    const movieData: Partial<IMovie> = {
      title: 'Test Movie',
      releaseDate: '2024-03-20',
      plot: 'Test plot',
      genre: categoriesIds,
      rating: 8.5,
      url: 'http://test.com',
    };

    const createdMovie = await movieRepository.create(movieData);
    const foundMovie = await movieRepository.findById(createdMovie._id);
    expect(foundMovie).not.toBeNull();
    expect(foundMovie?.title).toBe(movieData.title);
  });

  it('should update a movie', async () => {
    const movieData: Partial<IMovie> = {
      title: 'Test Movie',
      releaseDate: '2024-03-20',
      plot: 'Test plot',
      genre: categoriesIds,
      rating: 8.5,
      url: 'http://test.com',
    };

    const createdMovie = await movieRepository.create(movieData);
    const updatedData = { title: 'Updated Test Movie' };
    const updatedMovie = await movieRepository.update(createdMovie._id, updatedData);
    expect(updatedMovie).not.toBeNull();
    expect(updatedMovie?.title).toBe(updatedData.title);
  });

  it('should find all movies with pagination', async () => {
    const movieData: Partial<IMovie> = {
      title: 'Test Movie',
      releaseDate: '2024-03-20',
      plot: 'Test plot',
      genre: categoriesIds,
      rating: 8.5,
      url: 'http://test.com',
    };

    await movieRepository.create(movieData);
    const movies = await movieRepository.findAll(0, 10);
    expect(movies.length).toBeGreaterThan(0);
  });

  it('should delete a movie', async () => {
    const movieData: Partial<IMovie> = {
      title: 'Test Movie',
      releaseDate: '2024-03-20',
      plot: 'Test plot',
      genre: categoriesIds,
      rating: 8.5,
      url: 'http://test.com',
    };

    const createdMovie = await movieRepository.create(movieData);
    const deletedMovie = await movieRepository.delete(createdMovie._id);
    expect(deletedMovie).not.toBeNull();
    expect(deletedMovie?.title).toBe(createdMovie.title);
  });

  it('should find a movie by title', async () => {
    const movieData: Partial<IMovie> = {
      title: 'Test Movie',
      releaseDate: '2024-03-20',
      plot: 'Test plot',
      genre: categoriesIds,
      rating: 8.5,
      url: 'http://test.com',
    };

    await movieRepository.create(movieData);
    const movieTitle = movieData?.title || '';
    const foundMovie = await movieRepository.findByTitle(movieTitle, 0, 10);
    expect(foundMovie).not.toBeNull();
    expect(foundMovie?.length).toBeGreaterThan(0);
  });

  it('should find a movie by genre', async () => {
    const movieData: Partial<IMovie> = {
      title: 'Test Movie',
      releaseDate: '2024-03-20',
      plot: 'Test plot',
      genre: categoriesIds,
      rating: 8.5,
      url: 'http://test.com',
    };
    await movieRepository.create(movieData);
    const foundMovie = await movieRepository.findByGenre('Series', 0, 10);
    expect(foundMovie).not.toBeNull();
    expect(foundMovie?.length).toBeGreaterThan(0);
  });
});

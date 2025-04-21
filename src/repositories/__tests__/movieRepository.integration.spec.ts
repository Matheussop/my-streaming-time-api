import { connect, closeDatabase, clearSpecificDatabase, clearDatabase } from './mongooseSetup';
import { MovieRepository } from '../movieRepository';
import { IMovieResponse } from '../../interfaces/movie';
import { IStreamingTypeResponse, IGenreReference } from '../../interfaces/streamingTypes';
import { StreamingTypeRepository } from '../streamingTypeRepository';
import { Types } from 'mongoose';

describe('MovieRepository Integration Tests', () => {
  let movieRepository: MovieRepository;
  let genres: IGenreReference[] = [];
  
  beforeAll(async () => {
    await connect();
    movieRepository = new MovieRepository();
    const newStreamingTypeData: Partial<IStreamingTypeResponse> = {
      name: 'Disney+',
      supportedGenres: [
        { id: 1, name: 'Series', poster: 'series.jpg', _id: new Types.ObjectId() },
        { id: 2, name: 'Movies', poster: 'movies.jpg', _id: new Types.ObjectId() },
      ],
    };

    const streamingType = await createStreamingType(newStreamingTypeData as IStreamingTypeResponse);
    genres = streamingType.supportedGenres || [];
  });

  afterAll(async () => {
    await clearDatabase();
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearSpecificDatabase('contents');
  });

  const createStreamingType = async (streamingTypeObj: IStreamingTypeResponse): Promise<IStreamingTypeResponse> => {
    const streamingTypeRepository = new StreamingTypeRepository();
    return await streamingTypeRepository.create(streamingTypeObj);
  };

  it('should create a new movie', async () => {
    const movieData: Partial<IMovieResponse> = {
      title: 'Test Movie',
      contentType: 'movie',
      durationTime: 120,
      releaseDate: '2024-03-20T00:00:00.000Z',
      plot: 'Test plot',
      cast: ['Actor 1', 'Actor 2'],
      genre: [genres[0]],
      rating: 8.5,
      poster: 'poster.jpg',
      url: 'movie.mp4'
    };

    const createdMovie = await movieRepository.create(movieData) as IMovieResponse;
    expect(createdMovie).toHaveProperty('_id');
    expect(createdMovie.title).toBe(movieData.title);
  });

  it('should find a movie by id', async () => {
    const movieData: Partial<IMovieResponse> = {
      title: 'Test Movie',
      contentType: 'movie',
      durationTime: 120,
      releaseDate: '2024-03-20T00:00:00.000Z',
      plot: 'Test plot',
      cast: ['Actor 1', 'Actor 2'],
      genre: [genres[0]],
      rating: 8.5,
      poster: 'poster.jpg',
      url: 'movie.mp4'
    };

    const createdMovie = await movieRepository.create(movieData) as IMovieResponse;
    const foundMovie = await movieRepository.findById(createdMovie._id);
    expect(foundMovie).not.toBeNull();
    expect(foundMovie?.title).toBe(movieData.title);
  });

  it('should update a movie', async () => {
    const movieData: Partial<IMovieResponse> = {
      title: 'Test Movie',
      contentType: 'movie',
      durationTime: 120,
      releaseDate: '2024-03-20T00:00:00.000Z',
      plot: 'Test plot',
      cast: ['Actor 1', 'Actor 2'],
      genre: [genres[0]],
      rating: 8.5,
      poster: 'poster.jpg',
      url: 'movie.mp4'
    };

    const createdMovie = await movieRepository.create(movieData) as IMovieResponse;
    const updatedData = { title: 'Updated Test Movie' };
    const updatedMovie = await movieRepository.update(createdMovie._id, updatedData);
    expect(updatedMovie).not.toBeNull();
    expect(updatedMovie?.title).toBe(updatedData.title);
  });

  it('should find all movies with pagination', async () => {
    const movieData: Partial<IMovieResponse> = {
      title: 'Test Movie',
      contentType: 'movie',
      durationTime: 120,
      releaseDate: '2024-03-20T00:00:00.000Z',
      plot: 'Test plot',
      cast: ['Actor 1', 'Actor 2'],
      genre: [genres[0]],
      rating: 8.5,
      poster: 'poster.jpg',
      url: 'movie.mp4'
    };

    await movieRepository.create(movieData);
    const movies = await movieRepository.findAll(0, 10);
    expect(movies.length).toBeGreaterThan(0);
  });

  it('should delete a movie', async () => {
    const movieData: Partial<IMovieResponse> = {
      title: 'Test Movie',
      contentType: 'movie',
      durationTime: 120,
      releaseDate: '2024-03-20T00:00:00.000Z',
      plot: 'Test plot',
      cast: ['Actor 1', 'Actor 2'],
      genre: [genres[0]],
      rating: 8.5,
      poster: 'poster.jpg',
      url: 'movie.mp4'
    };

    const createdMovie = await movieRepository.create(movieData) as IMovieResponse;
    const deletedMovie = await movieRepository.delete(createdMovie._id);
    expect(deletedMovie).not.toBeNull();
    expect(deletedMovie?.title).toBe(createdMovie.title);
  });

  it('should find a movie by title', async () => {
    const movieData: Partial<IMovieResponse> = {
      title: 'Test Movie',
      contentType: 'movie',
      durationTime: 120,
      releaseDate: '2024-03-20T00:00:00.000Z',
      plot: 'Test plot',
      cast: ['Actor 1', 'Actor 2'],
      genre: [genres[0]],
      rating: 8.5,
      poster: 'poster.jpg',
      url: 'movie.mp4'
    };

    await movieRepository.create(movieData);
    const movieTitle = movieData.title || '';
    const foundMovies = await movieRepository.findByTitle(movieTitle, 0, 10);
    expect(foundMovies).not.toBeNull();
    expect(foundMovies?.length).toBeGreaterThan(0);
  });

  it('should find a movie by genre', async () => {
    const movieData: Partial<IMovieResponse> = {
      title: 'Test Movie',
      contentType: 'movie',
      durationTime: 120,
      releaseDate: '2024-03-20T00:00:00.000Z',
      plot: 'Test plot',
      cast: ['Actor 1', 'Actor 2'],
      genre: [genres[0]],
      rating: 8.5,
      poster: 'poster.jpg',
      url: 'movie.mp4'
    };
    
    await movieRepository.create(movieData);
    const foundMovies = await movieRepository.findByGenre(genres[0].name, 0, 10);
    expect(foundMovies).not.toBeNull();
    expect(foundMovies?.length).toBeGreaterThan(0);
  });
});

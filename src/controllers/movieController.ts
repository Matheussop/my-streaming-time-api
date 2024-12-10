import { Request, Response } from 'express';
import Movie from '../models/movieModel';
import { StreamingServiceError } from '../middleware/errorHandler';
import { catchAsync } from '../util/catchAsync';
import logger from '../config/logger';

export const getMovies = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10 } = req.body;
  const skip = (page - 1) * limit;

  logger.info({
    message: 'Fetching movies list',
    page,
    limit,
    skip,
    method: req.method,
    path: req.path
  });

  try {
    const movies = await Movie.find()
    .skip(skip)
    .limit(limit);
    res.status(200).json(movies);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getMovieById = catchAsync(async (req: Request, res: Response) => {
  logger.info({
    message: 'Fetching movie by ID',
    movieId: req.params.id,
    method: req.method,
    path: req.path
  });
  const movie = await Movie.findById(req.params.id);

  if (!movie) {
    logger.warn({
      message: 'Movie not found',
      movieId: req.params.id
    });
    throw new StreamingServiceError('Movie not found', 404);
  }

  res.status(200).json(movie);
});

export const createMovie = catchAsync(async (req: Request, res: Response) => {
  logger.info({
    message: 'Creating new movie',
    movieData: req.body,
    method: req.method,
    path: req.path
  });

  if (!req.body) {
    logger.warn({
      message: 'Request body is missing',
      method: req.method,
      path: req.path
    });
    throw new StreamingServiceError('Request body is missing', 400);
  }

  const requiredFields = ['title', 'rating', 'url', 'genre'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    throw new StreamingServiceError(`Missing required fields: ${missingFields.join(', ')}`, 400);
  }

  const movie = new Movie({
    title: req.body.title,
    release_date: req.body.release_date,
    plot: req.body.plot,
    cast: req.body.cast,
    genre: req.body.genre,
    rating: parseFloat(req.body.rating),
    url: req.body.url,
  });

  const newMovie = await movie.save();
  res.status(201).json(newMovie);
});

export const updateMovie = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!movie) {
      logger.warn({
        message: 'Movie not found for update',
        movieId: req.params.id
      });
      throw new StreamingServiceError('Movie not found', 404);
    }
    res.status(200).json(movie);
});

export const deleteMovie = catchAsync(async (req: Request, res: Response): Promise<void> => {
  logger.info({
    message: 'Deleting movie',
    movieId: req.params.id,
    method: req.method,
    path: req.path
  });
  const movie = await Movie.findByIdAndDelete(req.params.id);
  if (!movie) {
    logger.warn({
      message: 'Movie not found for deletion',
      movieId: req.params.id
    });
    throw new StreamingServiceError('Movie not found', 404);
  }

  res.status(200).json({ message: 'Movie deleted' });
});

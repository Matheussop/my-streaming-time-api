import { MovieService } from './../services/movieService';
import { Request, Response } from 'express';
import Movie from '../models/movieModel';
import { StreamingServiceError } from '../middleware/errorHandler';
import { catchAsync } from '../util/catchAsync';
import logger from '../config/logger';
import { IMovieRepository } from '../interfaces/repositories';

export class MovieController {
  private movieService: MovieService;

  constructor(private movieRepository: IMovieRepository) {
    this.movieService = new MovieService(movieRepository);
  }

  getMovies = catchAsync(async (req: Request, res: Response): Promise<void> =>{
    const { page = 1, limit = 10 } = req.body;
    const skip = (Number(page) - 1) * Number(limit);
  
    logger.info({
      message: 'Fetching movies list',
      page,
      limit,
      skip,
      method: req.method,
      path: req.path
    });

    if (Number(limit) > 100) {
      throw new StreamingServiceError('Limit cannot exceed 100 items', 400);
    }
  
    try {
      const movies = await this.movieService.getMovies(skip, limit);
      res.status(200).json(movies);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  getMovieById = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    logger.info({
      message: 'Fetching movie by ID',
      movieId: req.params.id,
      method: req.method,
      path: req.path
    });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new StreamingServiceError('Invalid movie ID format', 400);
    }

    const movie = await this.movieService.getMovieById(id);
  
    res.status(200).json(movie);
  });

  createMovie = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Creating new movie',
      movieData: req.body,
      method: req.method,
      path: req.path
    });
  

    if (!req.body || Object.keys(req.body).length === 0) {
      logger.warn({
        message: 'Request body is missing',
        method: req.method,
        path: req.path
      });
      throw new StreamingServiceError('Request body is missing', 400);
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
  
    const newMovie = await this.movieService.createMovie(movie);
    res.status(201).json(newMovie);
  });

  updateMovie = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    logger.info({
      message: 'Updating movie',
      movieId: id,
      updateData: req.body,
      method: req.method,
      path: req.path
    });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new StreamingServiceError('Invalid movie ID format', 400);
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      throw new StreamingServiceError('Update data is missing', 400);
    }

    const movie = await this.movieService.updateMovie(id, req.body);
    res.status(200).json(movie);
  });

  deleteMovie = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    logger.info({
      message: 'Deleting movie',
      movieId: req.params.id,
      method: req.method,
      path: req.path
    });
    


    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new StreamingServiceError('Invalid movie ID format', 400);
    }

    await this.movieService.deleteMovie(id);

    res.status(200).json({ message: 'Movie deleted successfully' });
  })
}

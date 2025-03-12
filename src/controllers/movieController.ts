import { Request, Response } from 'express';
import Movie from '../models/movieModel';
import { catchAsync } from '../util/catchAsync';
import logger from '../config/logger';
import { Messages } from '../constants/messages';
import { MovieService } from '../services/movieService';
import { PaginationSchemaType } from '../validators';

export class MovieController {
  constructor(private movieService: MovieService) {}

  getMoviesByTitle = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { title, page = 1, limit = 10 } = req.body;
    const skip = (Number(page) - 1) * Number(limit);
    logger.info({
      message: 'Fetching movies by title',
      title,
      method: req.method,
      path: req.path,
    });

    const movies = await this.movieService.getMoviesByTitle(title, skip, limit);
    res.status(200).json(movies);
  });

  getMoviesByGenre = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { genre, page = 1, limit = 10 } = req.body;
    const skip = (Number(page) - 1) * Number(limit);

    logger.info({
      message: 'Fetching movie by Genre',
      genre,
      method: req.method,
      path: req.path,
    });

    const movie = await this.movieService.getMoviesByGenre(genre, skip, limit);
    res.status(200).json(movie);
  });

  getMovies = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10 } = req.query as unknown as PaginationSchemaType;
    const skip = (Number(page) - 1) * Number(limit);
    
    logger.info({
      message: 'Fetching movies list',
      page,
      limit,
      skip,
      method: req.method,
      path: req.path,
    });

    const movies = await this.movieService.getMovies(skip, limit);
    res.status(200).json(movies);
  });

  getMovieById = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedIds.id;
    logger.info({
      message: 'Fetching movie by ID',
      movieId: id,
      method: req.method,
      path: req.path,
    });

    const movie = await this.movieService.getMovieById(id);
    res.status(200).json(movie);
  });

  createMovie = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Creating new movie',
      movieData: req.body,
      method: req.method,
      path: req.path,
    });

    const movie = new Movie({
      title: req.body.title,
      releaseDate: req.body.releaseDate,
      plot: req.body.plot,
      cast: req.body.cast,
      genre: req.body.genre,
      rating: parseFloat(req.body.rating),
      poster: req.body.poster,
      url: req.body.url,
    });
  
    const newMovie = await this.movieService.createMovie(movie);
    res.status(201).json(newMovie);
  });

  updateMovie = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedIds.id;

    logger.info({
      message: 'Updating movie',
      movieId: id,
      updateData: req.body,
      method: req.method,
      path: req.path,
    });

    const movie = await this.movieService.updateMovie(id, req.body);
    res.status(200).json(movie);
  });

  deleteMovie = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedIds.id;

    logger.info({
      message: 'Deleting movie',
      movieId: req.params.id,
      method: req.method,
      path: req.path,
    });

    await this.movieService.deleteMovie(id);
    res.status(200).json({ message: Messages.MOVIE_DELETED_SUCCESSFULLY });
  });

  updateMovieFromTMDB = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { tmdbId } = req.params;
    const id = req.validatedIds.id;

    logger.info({
      message: 'Updating movie by TMDB',
      movieId: id,
      updateData: req.body,
      method: req.method,
      path: req.path,
    });

    const movie = await this.movieService.updateMovieFromTMDB(id, tmdbId);
    res.status(200).json(movie);
  });
  
}

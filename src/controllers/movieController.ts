import { Request, Response } from 'express';
import Movie from '../models/movieModel';
import { validateRequest, validateRequiredFields } from '../util';

export const getMovies = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10 } = req.body;
  const skip = (page - 1) * limit;

  try {
    const movies = await Movie.find()
    .skip(skip)
    .limit(limit);
    res.status(200).json(movies);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getMovieById = async (req: Request, res: Response): Promise<void> => {
  try {
    const movie = await Movie.findById(req.params.id)


    if (!movie) {
      res.status(404).json({ message: 'Movie not found' });
      return;
    }
    res.status(200).json(movie);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createMovie = async (req: Request, res: Response): Promise<void> => {
  if (!req.body) {
    res.status(400).json({ message: 'Request body is missing' });
    return;
  }
  const requiredFields = ['title', 'rating', 'url', 'genre'];
  validateRequest(req, res, () => {
    const movie = new Movie({
      title: req.body.title,
      release_date: req.body.release_date,
      plot: req.body.plot,
      cast: req.body.cast,
      genre: req.body.genre,
      rating: parseFloat(req.body.rating), // Converter rating para número
      url: req.body.url,
    });

    movie.save()
      .then(newMovie => res.status(201).json(newMovie))
      .catch(err => res.status(400).json({ message: err.message }));
  }, requiredFields); 
};

export const updateMovie = async (req: Request, res: Response): Promise<void> => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!movie) {
      res.status(404).json({ message: 'Movie not found' });
      return;
    }
    res.status(200).json(movie);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteMovie = async (req: Request, res: Response): Promise<void> => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) {
      res.status(404).json({ message: 'Movie not found' });
      return;
    }
    res.status(200).json({ message: 'Movie deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

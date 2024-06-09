import { Request, Response } from 'express';
import Movie from '../models/movieModel';

export const getMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const movies = await Movie.find();
    res.status(200).json(movies);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getMovieById = async (req: Request, res: Response): Promise<void> => {
  try {
    const movie = await Movie.findById(req.params.id);
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
  const movie = new Movie({
    title: req.body.title,
    release_date: req.body.release_date,
    plot: req.body.plot,
    cast: req.body.cast,
    rating: req.body.rating,
    url: req.body.url,
  });

  try {
    const newMovie = await movie.save();
    res.status(201).json(newMovie);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
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

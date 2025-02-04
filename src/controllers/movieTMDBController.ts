import { Request, Response } from 'express';
import axios from 'axios';
import Movie, { IMovie } from '../models/movieModel';
import { StreamingServiceError } from '../middleware/errorHandler';

export interface Movie_TMDB {
  genre_ids: number[];
  original_title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  title: string;
  vote_average: number;
}

export const getExternalMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const url = 'https://api.themoviedb.org/3/movie/popular?language=pt-BR&page=1';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_Bearer_Token}`,
      },
    };
    const response = await axios.get(url, options);
    const myResponse = response.data.results.map((movie: any, index: number) => {
      return {
        id: movie.id,
        title: movie.title,
        year: movie.release_date,
        plot: movie.overview,
        genre: movie.genre_ids,
        rating: movie.vote_average,
        poster: `https://image.tmdb.org/t/p/original${movie.backdrop_path}`,
        url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      };
    });
    res.status(200).json(myResponse.splice(0, 8));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Method to make the external API request, modify the object and save to database
export const fetchAndSaveExternalMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    // Make the external API request
    const url = 'https://api.themoviedb.org/3/movie/popular?language=pt-BR&page=1';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_Bearer_Token}`,
      },
    };
    const response = await axios.get(url, options);

    const externalMovies = response.data.results;

    const existingMovies = await Movie.find({}, 'title').lean();
    const existingTitles = existingMovies.map((movie) => movie.title);

    const newMovies = externalMovies
      .filter((externalMovie: any) => !existingTitles.includes(externalMovie.title))
      .map((externalMovie: any) => ({
        title: externalMovie.title,
        release_date: externalMovie.release_date,
        plot: externalMovie.overview,
        genre: externalMovie.genre_ids,
        rating: externalMovie.vote_average,
        tmdbId: externalMovie.id,
        poster: `https://image.tmdb.org/t/p/original${externalMovie.backdrop_path}`,
        url: `https://image.tmdb.org/t/p/w500${externalMovie.poster_path}`,
      }));

    const savedMovies = await Movie.insertMany(newMovies);

    res.status(201).json(savedMovies);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const findOrAddMovie = async (req: Request, res: Response): Promise<void> => {
  const { title, page = 1, limit = 10 } = req.body;
  const skip = (page - 1) * limit;

  if (!title) {
    res.status(400).json({ message: 'Title parameter is required' });
    return;
  }

  try {
    const regex = new RegExp(title, 'i'); // 'i' for case-insensitive

    const existingMovies = await Movie.find({ title: { $regex: regex } })
      .skip(skip)
      .limit(limit)
      .lean();

    if (existingMovies.length > 5) {
      res.status(200).json({
        page,
        limit,
        total: existingMovies.length,
        movies: existingMovies,
      });
      console.log('Movie already existed in database with this parameter');
      return;
    }

    if (!process.env.TMDB_Bearer_Token || process.env.TMDB_Bearer_Token === '') {
      throw new StreamingServiceError('Invalid TMDB_Bearer_Token', 401);
    }

    const encodedQueryParams = encodeURIComponent(title.trim());
    // If not in database, check external API
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodedQueryParams}&include_adult=false&language=pt-BR&page=${page}`;

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_Bearer_Token}`,
      },
    };
    const response = await axios.get(url, options);
    console.log('To consultando o TMDB');

    if (response.data.results.length > 0) {
      const externalMovies = response.data.results.map((externalMovie: any) => ({
        title: externalMovie.title,
        release_date: externalMovie.release_date,
        plot: externalMovie.overview,
        rating: externalMovie.vote_average,
        genre: externalMovie.genre_ids,
        tmdbId: externalMovie.id,
        poster: `https://image.tmdb.org/t/p/original${externalMovie.backdrop_path}`,
        url: `https://image.tmdb.org/t/p/w500${externalMovie.poster_path}`,
      }));

      const existingTitles = existingMovies.map((movie) => movie.title);

      let newMoviesList: IMovie[] = []
      externalMovies.filter((externalMovie: any) => {
        !existingTitles.includes(externalMovie.title) && newMoviesList.push(externalMovie)
      });

      if (newMoviesList.length > 0) {
        const savedMovies = await Movie.insertMany(newMoviesList);
        res.status(200).json({
          page,
          limit,
          total: savedMovies.length,
          movies: savedMovies,
        });
      } else {
        res.status(200).json({
          page,
          limit,
          total: existingMovies.length,
          movies: existingMovies,
        });
      }
    } else {
      throw new StreamingServiceError('Movie not found', 404);
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

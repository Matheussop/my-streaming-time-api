import { Request, Response } from 'express';
import axios from 'axios';
import Movie from '../models/movieModel';
import { StreamingServiceError } from '../middleware/errorHandler';
import { IMovieResponse } from '../interfaces/movie';

export interface Movie_TMDB {
  genre_ids: number[];
  original_title: string;
  overview: string;
  poster_path: string;
  releaseDate: string;
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
    const existingTitles = existingMovies.map((movie: any) => movie.title);

    const newMovies = externalMovies
      .filter((externalMovie: any) => !existingTitles.includes(externalMovie.title))
      .map((externalMovie: any) => ({
        title: externalMovie.title,
        releaseDate: externalMovie.release_date,
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

  const searchTerms = title.trim().split(' ');
  
  // Creating a query that searches for all terms individually
  // This is more effective for finding partial matches
  const query = {
    $and: searchTerms.map((term: string) => ({
      title: { $regex: term, $options: 'i' }
    }))
  };

  // Get total count for pagination
  const totalCount = await Movie.countDocuments(query);
  
  if (totalCount > 0 && skip < totalCount) {
    const existingMovies = await Movie.find(query)
      .skip(skip)
      .limit(limit)
      .lean();

    if (existingMovies.length > 0) {
      res.status(200).json({
        page,
        limit,
        total: totalCount,
        movies: existingMovies,
        hasMore: skip + existingMovies.length < totalCount
      });
      return;
    }
  }

  if (!process.env.TMDB_Bearer_Token || process.env.TMDB_Bearer_Token === '') {
    throw new StreamingServiceError('Invalid TMDB_Bearer_Token', 401);
  }

  const encodedQueryParams = encodeURIComponent(title.trim());
  const tmdbPage = Math.max(1, Math.floor(skip / limit) + 1);
  
  const url = `https://api.themoviedb.org/3/search/movie?query=${encodedQueryParams}&include_adult=false&language=pt-BR&page=${tmdbPage}`;

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${process.env.TMDB_Bearer_Token}`,
    },
  };

  const response = await axios.get(url, options);

  if (response.data.results.length === 0) {
    const existingMovies = await Movie.find(query)
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      page,
      limit,
      total: totalCount,
      movies: existingMovies,
      hasMore: false
    });
    return;
  }

  const externalMovies = response.data.results.map((movie: any) => ({
    title: movie.title,
    releaseDate: movie.release_date,
    plot: movie.overview,
    rating: movie.vote_average,
    genre: movie.genre_ids,
    tmdbId: movie.id,
    poster: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : '',
    url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
  }));

  // Check which movies already exist in the database (using tmdbId)
  const existingTmdbIds = await Movie.find({
    tmdbId: { $in: externalMovies.map((movie: any) => movie.tmdbId) }
  }, 'tmdbId').lean();
  
  const existingIds = existingTmdbIds.map((movie: any) => movie.tmdbId);

  // Filter only new movies that don't exist in the database
  const newMoviesList = externalMovies.filter((movie: any) => 
    !existingIds.includes(movie.tmdbId)
  );

  // Insert new movies in the database
  if (newMoviesList.length > 0) {
    await Movie.insertMany(newMoviesList);
  }

  // Search again to get paginated results now that we have more movies
  const updatedTotalCount = await Movie.countDocuments(query);
  
  const paginatedMovies = await Movie.find(query)
    .skip(skip)
    .limit(limit)
    .lean();

  // Indicate if there are more results after this page
  const hasMore = skip + paginatedMovies.length < updatedTotalCount;

  res.status(200).json({
    page,
    limit,
    total: updatedTotalCount,
    movies: paginatedMovies,
    hasMore
  });
  
};

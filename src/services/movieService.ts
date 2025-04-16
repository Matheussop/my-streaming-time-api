import { TMDBService } from './tmdbService';
import logger from '../config/logger';
import { ErrorMessages } from '../constants/errorMessages';
import { IMovieService } from '../interfaces/services';
import { StreamingServiceError } from '../middleware/errorHandler';
import { MovieRepository } from '../repositories/movieRepository';
import axios from 'axios';
import { IMovieResponse } from '../interfaces/movie';
import { Types } from 'mongoose';
export class MovieService implements IMovieService {
  constructor(
    private tmdbService: TMDBService,
    private movieRepository: MovieRepository,
  ) {}

  async getMovies(skip: number, limit: number) {
    return this.movieRepository.findAll(skip, limit);
  }

  async getMovieById(id: string | Types.ObjectId) {
    const movie = await this.movieRepository.findById(id);
    
    if (!movie) {
      logger.warn({
        message: 'Movie not found',
        movieId: id,
      });
      throw new StreamingServiceError(ErrorMessages.MOVIE_NOT_FOUND, 404);
    }

    // If the movie has no duration time, it means it was not updated from TMDB yet.
    if (!movie.durationTime && movie.tmdbId) {
      const tmdbData = await this.tmdbService.fetchDataFromTMDB(movie.tmdbId, "movie");
      movie.durationTime = tmdbData.runtime;
      movie.videoUrl = this.getTrailerUrl(tmdbData.videos.results);
      await this.movieRepository.update(id, movie);
    }
    return movie;
  }

  async createMovie(movieData: any) {
    await this.checkDuplicateTitle(movieData.title.trim());

    const processedData = {
      title: movieData.title.trim(),
      releaseDate: this.validateReleaseDate(movieData.releaseDate),
      plot: movieData.plot,
      cast: this.processCastList(movieData.cast),
      genre: movieData.genre,
      rating: this.validateRating(movieData.rating),
      poster: this.validateURL(movieData.poster),
      url: this.validateURL(movieData.url),
    };

    return this.movieRepository.create(processedData);
  }

  async updateMovie(id: string | Types.ObjectId, updateData: any) {
    const existingMovie = await this.movieRepository.findById(id);

    if (!existingMovie) {
      logger.warn({
        message: 'Movie not found for update',
        movieId: id,
      });
      throw new StreamingServiceError(ErrorMessages.MOVIE_NOT_FOUND, 404);
    }

    // If updating the title, check for duplicates
    if (updateData.title && updateData.title !== existingMovie.title) {
      await this.checkDuplicateTitle(updateData.title);
    }

    const processedUpdate = await this.processUpdateData(updateData);

    return this.movieRepository.update(id, processedUpdate);
  }

  async deleteMovie(id: string | Types.ObjectId) {
    const movie = await this.movieRepository.delete(id);
    if (!movie) {
      logger.warn({
        message: 'Movie not found for deletion',
        movieId: id,
      });
      throw new StreamingServiceError(ErrorMessages.MOVIE_NOT_FOUND, 404);
    }
    return movie;
  }

  async getMoviesByTitle(title: string, skip: number, limit: number) {
    const movies = await this.movieRepository.findByTitle(title, skip, limit);
    if (!movies || movies.length <= 0) {
      logger.warn({
        message: 'Movie not found',
        title: title,
      });
      throw new StreamingServiceError(ErrorMessages.MOVIES_NOT_FOUND, 404);
    }

    return movies;
  }

  async getMoviesByGenre(genre: string, skip: number, limit: number) {
    const movies = await this.movieRepository.findByGenre(genre, skip, limit);
    if (!movies || movies.length <= 0) {
      logger.warn({
        message: 'Movies not found',
        genre,
      });
      throw new StreamingServiceError(ErrorMessages.MOVIES_NOT_FOUND, 404);
    }

    return movies;
  }

  async updateMovieFromTMDB(movieId: string | Types.ObjectId, tmdbId: number): Promise<void> {
    const tmdbData = await this.tmdbService.fetchDataFromTMDB(tmdbId, 'movie');
    await this.tmdbService.updateData(this.movieRepository, movieId, tmdbData);
  }

  async fetchAndSaveExternalMovies(): Promise<void | IMovieResponse[]>{
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
    const externalMoviesMinusInternalMovies = await Promise.all(
      externalMovies.map(async (externalSerie: any) => {
      const existingMovies = await this.movieRepository.findByTitle(externalSerie.title, 0, 1);
      return existingMovies && existingMovies.length === 0 ? externalSerie : null;
      })
    ).then(results => results.filter(movies => movies !== null));

    const newMovies: IMovieResponse[] = externalMoviesMinusInternalMovies
      .map((externalMovie: any) => ({
        cast: externalMovie.cast,
        title: externalMovie.title,
        releaseDate: externalMovie.release_date,
        plot: externalMovie.overview,
        genre: externalMovie.genre_ids,
        rating: externalMovie.vote_average,
        tmdbId: externalMovie.id,
        poster: `https://image.tmdb.org/t/p/original${externalMovie.backdrop_path}`,
        url: `https://image.tmdb.org/t/p/w500${externalMovie.poster_path}`,
      } as IMovieResponse));
    
    if (newMovies.length > 0) {
      return await this.movieRepository.createManyMovies(newMovies);
    } else {
      return;
    }
  }
  
  private async checkDuplicateTitle(title: string) {
    const movies = await this.movieRepository.findByTitle(title, 0, 1);
    if (movies && movies.length > 0) {
      throw new StreamingServiceError(ErrorMessages.MOVIE_WITH_TITLE_EXISTS, 400);
    }
  }

  private validateRating(rating: any): number {
    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 0 || numRating > 10) {
      throw new StreamingServiceError(ErrorMessages.MOVIE_RATING_INVALID, 400);
    }
    return numRating;
  }

  private validateReleaseDate(date: string): string {
    const releaseDate = new Date(date);
    if (isNaN(releaseDate.getTime())) {
      throw new StreamingServiceError(ErrorMessages.MOVIE_RELEASE_DATE_INVALID, 400);
    }
    if (releaseDate > new Date()) {
      // TODO This may need to be removed in the future, as we will accept upcoming movie releases.
      throw new StreamingServiceError(ErrorMessages.MOVIE_RELEASE_DATE_FUTURE, 400);
    }
    //Return date without time
    return releaseDate.toISOString().split('T')[0];
  }

  private validateURL(url: string, value: boolean = true): string {
    return url
  }

  private processCastList(cast: any[]): string[] {
    if (!Array.isArray(cast)) {
      throw new StreamingServiceError(ErrorMessages.MOVIE_CAST_INVALID, 400);
    }
    return cast.map((actor) => actor.trim());
  }

  private async processUpdateData(data: any) {
    const processed: any = {};

    if (data.title) processed.title = data.title.trim();
    if (data.rating) processed.rating = this.validateRating(data.rating);
    if (data.releaseDate) processed.releaseDate = this.validateReleaseDate(data.releaseDate);
    if (data.genre) processed.genre = data.genre;
    if (data.url) processed.url = this.validateURL(data.url);
    if (data.cast) processed.cast = this.processCastList(data.cast);
    if (data.plot) processed.plot = data.plot;

    return processed;
  }

  private getTrailerUrl(trailers: any[]): string {
    const trailer = trailers.find((trailer) => trailer.type === 'Trailer')
    return trailer ? trailer.key : '';
  }
}

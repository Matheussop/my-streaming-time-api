import { TMDBService } from './tmdbService';
import { StreamingTypeRepository } from './../repositories/streamingTypeRepository';
import logger from '../config/logger';
import { ErrorMessages } from '../constants/errorMessages';
import { IMovieService } from '../interfaces/services';
import { StreamingServiceError } from '../middleware/errorHandler';
import { MovieRepository } from '../repositories/movieRepository';
import axios from 'axios';
import { IMovie } from '../models/movieModel';

export class MovieService implements IMovieService {
  constructor(
    private tmdbService: TMDBService,
    private movieRepository: MovieRepository,
    private streamingTypeRepository: StreamingTypeRepository,
  ) {}

  async getMovies(skip: number, limit: number) {
    return this.movieRepository.findAll(skip, limit);
  }

  async getMovieById(id: string) {
    const movie = await this.movieRepository.findById(id);
    if (!movie) {
      logger.warn({
        message: 'Movie not found',
        movieId: id,
      });
      throw new StreamingServiceError(ErrorMessages.MOVIE_NOT_FOUND, 404);
    }
    return movie;
  }

  async createMovie(movieData: any) {
    await this.checkDuplicateTitle(movieData.title.trim());

    const processedData = {
      title: movieData.title.trim(),
      release_date: this.validateReleaseDate(movieData.release_date),
      plot: movieData.plot,
      cast: this.processCastList(movieData.cast),
      genre: movieData.genre,
      rating: this.validateRating(movieData.rating),
      poster: this.validateURL(movieData.poster),
      url: this.validateURL(movieData.url),
    };

    return this.movieRepository.create(processedData);
  }

  async updateMovie(id: string, updateData: any) {
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

  async deleteMovie(id: string) {
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

  async updateMovieFromTMDB(movieId: string, tmdbId: string): Promise<void> {
    const tmdbData = await this.tmdbService.fetchDataFromTMDB(tmdbId, 'movie');
    await this.tmdbService.updateData(this.movieRepository, movieId, tmdbData);
  }

  async fetchAndSaveExternalMovies(): Promise<void | IMovie[]>{
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

    const newMovies: IMovie[] = externalMoviesMinusInternalMovies
      .map((externalMovie: any) => ({
        cast: externalMovie.cast,
        title: externalMovie.title,
        release_date: externalMovie.release_date,
        plot: externalMovie.overview,
        genre: externalMovie.genre_ids,
        rating: externalMovie.vote_average,
        tmdbId: externalMovie.id,
        poster: `https://image.tmdb.org/t/p/original${externalMovie.backdrop_path}`,
        url: `https://image.tmdb.org/t/p/w500${externalMovie.poster_path}`,
      } as IMovie));
    
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

  private validateURL(url: string): string {
    try {
      // TODO For now the URL is accepted as is, but at some point it will need to be validated.
      return url;
    } catch {
      throw new StreamingServiceError(ErrorMessages.MOVIE_URL_INVALID, 400);
    }
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
    if (data.release_date) processed.release_date = this.validateReleaseDate(data.release_date);
    if (data.genre) processed.genre = data.genre;
    if (data.url) processed.url = this.validateURL(data.url);
    if (data.cast) processed.cast = this.processCastList(data.cast);
    if (data.plot) processed.plot = data.plot;

    return processed;
  }
}

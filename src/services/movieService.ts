import logger from '../config/logger';
import { IMovieRepository } from '../interfaces/repositories';
import { StreamingServiceError } from '../middleware/errorHandler';

export class MovieService {
  constructor(private movieRepository: IMovieRepository) {}

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
      throw new StreamingServiceError('Movie not found', 404);
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
      throw new StreamingServiceError('Movie not found', 404);
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
      throw new StreamingServiceError('Movie not found', 404);
    }
    return movie;
  }

  async getMoviesByTitle(title: string, skip?: number, limit?: number) {
    const movies = await this.movieRepository.findByTitle(title, skip, limit);
    if (!movies || movies.length <= 0) {
      logger.warn({
        message: 'Movie not found',
        title: title,
      });
      throw new StreamingServiceError('Movie not found', 404);
    }

    return movies;
  }

  // Private validation and processing methods
  private async checkDuplicateTitle(title: string) {
    const movies = await this.movieRepository.findByTitle(title, 0, 1);
    if (movies && movies.length > 0) {
      throw new StreamingServiceError('Movie with this title already exists', 400);
    }
  }

  private validateRating(rating: any): number {
    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 0 || numRating > 10) {
      throw new StreamingServiceError('Rating must be a number between 0 and 10', 400);
    }
    return numRating;
  }

  private validateReleaseDate(date: string): string {
    const releaseDate = new Date(date);
    if (isNaN(releaseDate.getTime())) {
      throw new StreamingServiceError('Invalid release date', 400);
    }
    if (releaseDate > new Date()) {
      // TODO This may need to be removed in the future, as we will accept upcoming movie releases.
      throw new StreamingServiceError('Release date cannot be in the future', 400);
    }
    //Return date without time
    return releaseDate.toISOString().split('T')[0];
  }

  private validateURL(url: string): string {
    try {
      // TODO For now the URL is accepted as is, but at some point it will need to be validated.
      return url;
    } catch {
      throw new StreamingServiceError('Invalid URL format', 400);
    }
  }

  private processCastList(cast: any[]): string[] {
    if (!Array.isArray(cast)) {
      throw new StreamingServiceError('Cast must be an array', 400);
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

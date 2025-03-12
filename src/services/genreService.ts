import { GenreRepository } from './../repositories/genreRepository';
import { IGenreService } from "./../interfaces/services";
import { IGenreCreate, IGenreResponse, IGenreUpdate } from '../interfaces/genres';
import { StreamingServiceError } from '../middleware/errorHandler';
import { ErrorMessages } from '../constants/errorMessages';
import logger from '../config/logger';
import { Types } from 'mongoose';

export class GenreService implements IGenreService {
  constructor(private genreRepository: GenreRepository) {}

  async getGenreById(id: string | Types.ObjectId): Promise<IGenreResponse | null>{
    const genre = await this.genreRepository.findById(id);
    if (!genre) {
      logger.warn({
        message: ErrorMessages.GENRE_NOT_FOUND,
        genreId: id,
      })

      throw new StreamingServiceError(ErrorMessages.GENRE_NOT_FOUND, 404)
    }
    return genre
  };
  async getGenreByName(name: string): Promise<IGenreResponse | null>{
    const genre = await this.genreRepository.findByName(name);
    if (!genre) {
      logger.warn({
        message: ErrorMessages.GENRE_NOT_FOUND,
        genreName: name,
      })

      throw new StreamingServiceError(ErrorMessages.GENRE_NOT_FOUND, 404)
    }
    return genre
  };
  async getAllGenres(skip: number, limit: number): Promise<IGenreResponse[]>{
    return this.genreRepository.findAll(skip, limit);
  };

  async createGenre(genre: IGenreCreate | IGenreCreate[]): Promise<IGenreResponse | IGenreResponse[]>{
    const genreCreated = await this.genreRepository.create(genre);
    if (!genreCreated) {
      logger.warn({
        message: "Genre cannot be created",
        genreData: genre,
      })

      throw new StreamingServiceError("Genre cannot be created", 404)
    }
    return genreCreated
  };

  async updateGenre(id: string | Types.ObjectId, genre: IGenreUpdate): Promise<IGenreResponse | null>{
    const genreUpdated = await this.genreRepository.update(id, genre);
    if (!genreUpdated) {
      logger.warn({
        message: "Genre cannot be updated",
        genreData: genre,
      })

      throw new StreamingServiceError("Genre cannot be updated", 404)
    }
    return genreUpdated
  };

  async deleteGenre(genreId: string | Types.ObjectId): Promise<IGenreResponse | null>{
    const genreDeleted = await this.genreRepository.delete(genreId)
    if (!genreDeleted) {
      logger.warn({
        message: "Genre cannot be deleted",
        genreId,
      })

      throw new StreamingServiceError("Genre cannot be deleted", 404)
    }
    return genreDeleted
  };
}
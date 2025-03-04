import { StreamingServiceError } from '../middleware/errorHandler';
import {
  IStreamingTypeCreate,
  IStreamingTypeUpdate,
  IStreamingTypeResponse,
  IGenreReference,
} from '../interfaces/streamingTypes';
import logger from '../config/logger';
import { IStreamingTypeService } from '../interfaces/services';
import { StreamingTypeRepository } from '../repositories/streamingTypeRepository';
import { GenreRepository } from '../repositories/genreRepository';
import { ErrorMessages } from '../constants/errorMessages';
import { Types } from 'mongoose';

export class StreamingTypeService implements IStreamingTypeService {
  constructor(
    private repository: StreamingTypeRepository,
    private genreRepository?: GenreRepository
  ) {}

  async getAllStreamingTypes(skip = 0, limit = 10): Promise<IStreamingTypeResponse[]> {
    return this.repository.findAll(skip, limit);
  }

  async getStreamingTypeById(id: string): Promise<IStreamingTypeResponse> {
    const streamingType = await this.repository.findById(id);
    if (!streamingType) {
      logger.warn({
        message: ErrorMessages.STREAMING_TYPE_NOT_FOUND,
        streamingTypeId: id,
      });
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404);
    }
    return streamingType;
  }

  async getStreamingTypeByName(name: string): Promise<IStreamingTypeResponse> {
    const streamingType = await this.repository.findByName(name);
    if (!streamingType) {
      logger.warn({
        message: ErrorMessages.STREAMING_TYPE_NOT_FOUND,
        streamingTypeName: name,
      });
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404);
    }
    return streamingType;
  }

  async createStreamingType(data: IStreamingTypeCreate): Promise<IStreamingTypeCreate> {
    await this.validateStreamingTypeData(data);
    await this.checkDuplicateName(data.name!);

    const dataResponse = await this.repository.create(data);
    return dataResponse;
  }

  async updateStreamingType(id: string, data: IStreamingTypeUpdate): Promise<IStreamingTypeResponse> {
    if (data.name) {
      await this.checkDuplicateName(data.name, id);
    }

    const updatedType = await this.repository.update(id, data);
    if (!updatedType) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404);
    }

    return updatedType;
  }

  async addGenreToStreamingType(id: string, genres: IGenreReference[]): Promise<IStreamingTypeResponse> {
    await this.validateGenreIds(genres);
    
    await this.checkDuplicateGenreName(genres, id);
    const streamingType = await this.repository.addGenre(id, genres);
    if (!streamingType) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404);
    }
    return streamingType;
  }

  async deleteGenresFromStreamingTypeByName(id: string, genresName: string[]): Promise<IStreamingTypeResponse | null> {
    const result = await this.repository.deleteByGenresName(genresName, id);
    if (!result) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404);
    }
    return result;
  }

  async deleteStreamingType(id: string): Promise<IStreamingTypeResponse | null> {
    const result = await this.repository.delete(id);
    if (!result) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404);
    }
    return result;
  }

  private async validateStreamingTypeData(data: Partial<IStreamingTypeResponse>): Promise<void> {
    if (!data.name) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NAME_REQUIRED, 400);
    }
  }

  private async checkDuplicateName(name: string, excludeId?: string): Promise<void> {
    const existing = (await this.repository.findByName(name)) as IStreamingTypeResponse | null;
    if (existing && (!excludeId || existing._id.toString() !== excludeId)) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NAME_EXISTS, 400);
    }
  }

  private async validateGenreIds(genres: IGenreReference[]): Promise<void> {
    if (!genres || genres.length === 0) {
      throw new StreamingServiceError(ErrorMessages.GENRE_REQUIRED, 400);
    }

    for (const genre of genres) {
      if (!genre._id) {
        throw new StreamingServiceError(ErrorMessages.GENRE_INTERNAL_ID_INVALID, 400);
      }
      
      if (!Types.ObjectId.isValid(genre._id.toString())) {
        throw new StreamingServiceError(
          ErrorMessages.INVALID_ID_FORMAT('genre'), 
          400
        );
      }
      
      if (this.genreRepository) {
        const existingGenre = await this.genreRepository.findById(genre._id.toString());
        if (!existingGenre) {
          throw new StreamingServiceError(ErrorMessages.GENRE_NOT_FOUND, 404);
        }
        
        if (existingGenre.id !== genre.id) {
          throw new StreamingServiceError(
            ErrorMessages.GENRE_ID_MISMATCH(genre.id, existingGenre.id), 
            400
          );
        }
        
        if (existingGenre.name !== genre.name) {
          throw new StreamingServiceError(
            ErrorMessages.GENRE_NAME_MISMATCH(genre.name, existingGenre.name), 
            400
          );
        }
      }
    }
  }
  
  private async checkDuplicateGenreName(genres: IGenreReference[], id: string): Promise<void> {
    const errors: string[] = [];
    await Promise.all(genres.map(async (genre) => {
      const existing = (await this.repository.findByGenreName(genre.name, id)) as IStreamingTypeResponse | null;
      if (existing) {
        const supportedGenres = existing.supportedGenres;
        if (supportedGenres && supportedGenres.some(genre => genres.some(g => g.id === genre.id))) {
          errors.push(genre.name);
        }
      }
    }));
    if (errors.length > 0) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_GENRE_NAME_EXISTS(errors.join(', ')), 400);
    }
  }
}

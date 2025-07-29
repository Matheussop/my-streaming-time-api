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
import axios from 'axios';

export class StreamingTypeService implements IStreamingTypeService {
  constructor(
    private repository: StreamingTypeRepository,
    private genreRepository?: GenreRepository
  ) {}

  async getAllStreamingTypes(skip = 0, limit = 10): Promise<IStreamingTypeResponse[]> {
    return this.repository.findAll(skip, limit);
  }

  async getStreamingTypeById(id: string | Types.ObjectId): Promise<IStreamingTypeResponse> {
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

  async updateStreamingType(id: string | Types.ObjectId, data: IStreamingTypeUpdate): Promise<IStreamingTypeResponse> {
    if (data.name) {
      await this.checkDuplicateName(data.name, id);
    }

    const updatedType = await this.repository.update(id, data);
    if (!updatedType) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404);
    }

    return updatedType;
  }

  async addGenreToStreamingType(id: string | Types.ObjectId, genres: IGenreReference[]): Promise<IStreamingTypeResponse> {
    await this.validateGenreIds(genres);
    
    await this.checkDuplicateGenreName(genres, id);
    const streamingType = await this.repository.addGenre(id, genres);
    if (!streamingType) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404);
    }
    return streamingType;
  }

  async deleteGenresFromStreamingTypeByName(id: string | Types.ObjectId, genresName: string[]): Promise<IStreamingTypeResponse | null> {
    const result = await this.repository.deleteByGenresName(genresName, id);
    if (!result) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404);
    }
    return result;
  }

  async deleteStreamingType(id: string | Types.ObjectId): Promise<IStreamingTypeResponse | null> {
    const result = await this.repository.delete(id);
    if (!result) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404);
    }
    return result;
  }

  /**
   * Updates the cover images for supported genres of all streaming types
   * @returns Promise<void>
   * @throws StreamingServiceError if the TMDB token is invalid or if no streaming types are found
   */
  async changeCover(): Promise<void> {
    this.validateTmdbToken();
    
    const allStreamingTypes = await this.repository.findAll(0, 100);

    // Process each streaming type and update its covers
    const updatedStreamingTypes = await this.processStreamingTypes(allStreamingTypes);
    
    // Persist the updates in the database
    await this.saveUpdatedStreamingTypes(updatedStreamingTypes);
  }
  
  private validateTmdbToken(): void {
    if (!process.env.TMDB_Bearer_Token || process.env.TMDB_Bearer_Token === '') {
      throw new StreamingServiceError(ErrorMessages.TMDB_TOKEN_INVALID, 401);
    }
  }
  
  /**
   * Processes each streaming type to update the covers of the genres
   * @param streamingTypes List of streaming types to be processed
   * @returns List of streaming types with updated covers
   */
  private async processStreamingTypes(streamingTypes: IStreamingTypeResponse[]): Promise<IStreamingTypeResponse[]> {
    return Promise.all(streamingTypes.map(async (streamingType) => {
      const supportedGenres = streamingType.supportedGenres;
      if (!supportedGenres) {
        return streamingType;
      }
      const updatedGenres = await this.updateGenreCovers(supportedGenres, streamingType.name);
      
      return {
        ...streamingType,
        supportedGenres: updatedGenres
      };
    }));
  }
  
  /**
   * Updates the covers for each supported genre
   * @param genres List of genres to be updated
   * @returns List of genres with updated covers
   */
  private async updateGenreCovers(genres: IGenreReference[], categoryName: string): Promise<IGenreReference[]> {
    return Promise.all(genres.map(async (genre) => {
      try {
        const updatedGenre = await this.fetchCoverForGenre(genre, categoryName);
        return updatedGenre;
      } catch (error) {
        logger.error({
          message: ErrorMessages.TMDB_COVER_FETCH_ERROR,
          error,
          genreId: genre.id,
          genreName: genre.name
        });
        return genre; // Return the original genre in case of error
      }
    }));
  }
  
  /**
   * Searches for a new cover for a specific genre in the TMDB API
   * @param genre Genre for which to search for a new cover
   * @returns Genre with the updated cover
   */
  private async fetchCoverForGenre(genre: IGenreReference, categoryName: string): Promise<IGenreReference> {
    // Determine the correct category for the TMDB API
    const category = categoryName === 'movies' ? 'movie' : 'tv';
    
    // Configure the request to the TMDB API
    const url = `https://api.themoviedb.org/3/discover/${category}`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_Bearer_Token}`,
      },
      params: {
        without_genres: genre.id,
        sort_by: 'popularity.desc',
        include_adult: false,
        include_video: false,
        language: 'en-US',
        page: Math.floor(Math.random() * 5) + 1
      }
    };
    
    const response = await axios.get(url, options); // TODO: use a project instance of axios
    
    if (response.data.results.length > 0) {
      const randomIndex = Math.floor(Math.random() * response.data.results.length);
      const poster = response.data.results[randomIndex].backdrop_path;
      
      return {
        ...genre,
        poster: `https://image.tmdb.org/t/p/original${poster}`
      };
    }
    
    return genre; // Return the original genre if no results are found
  }
  
  /**
   * Saves the updated streaming types in the database
   * @param streamingTypes List of streaming types with updated covers
   * @throws StreamingServiceError if no streaming types are updated
   */
  private async saveUpdatedStreamingTypes(streamingTypes: IStreamingTypeResponse[]): Promise<void> {
    const updatePromises = streamingTypes.map(streamingType => 
      this.repository.update(streamingType._id, { 
        supportedGenres: streamingType.supportedGenres 
      })
    );
    
    const updatedTypes = await Promise.all(updatePromises);
    const successfulUpdates = updatedTypes.filter(Boolean);
    
    if (successfulUpdates.length === 0) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404);
    }
  }

  private async validateStreamingTypeData(data: Partial<IStreamingTypeResponse>): Promise<void> {
    if (!data.name) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NAME_REQUIRED, 400);
    }
  }

  private async checkDuplicateName(name: string, excludeId?: string | Types.ObjectId): Promise<void> {
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
  
  private async checkDuplicateGenreName(genres: IGenreReference[], id: string | Types.ObjectId): Promise<void> {
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

  /**
   * Synchronizes streamingTypes with available genres
   * Creates default streamingTypes and links them with existing genres
   */
  async syncStreamingTypesWithGenres(): Promise<{ created: number, updated: number }> {
    if (!this.genreRepository) {
      throw new StreamingServiceError('GenreRepository not available', 500);
    }

    try {
      logger.info('Starting streaming types synchronization with genres...');

      const allGenres = await this.genreRepository.findAll(0, 1000);
      if (allGenres.length === 0) {
        logger.warn('No genres found. Please sync genres first.');
        return { created: 0, updated: 0 };
      }

      const defaultStreamingTypes = [
        {
          name: 'movies',
          description: 'Streaming service focused on movies',
          supportedGenres: allGenres.map(genre => ({
            id: genre.id,
            name: genre.name,
            poster: genre.poster || '',
            _id: genre._id
          }))
        },
        {
          name: 'series',
          description: 'Streaming service focused on TV series',
          supportedGenres: allGenres.map(genre => ({
            id: genre.id,
            name: genre.name,
            poster: genre.poster || '',
            _id: genre._id
          }))
        }
      ];

      let created = 0;
      let updated = 0;

      for (const streamingTypeData of defaultStreamingTypes) {
        const existingStreamingType = await this.repository.findByName(streamingTypeData.name);
        
        if (existingStreamingType) {
          await this.repository.update(existingStreamingType._id, {
            supportedGenres: streamingTypeData.supportedGenres
          });
          updated++;
          logger.info(`Updated streaming type: ${streamingTypeData.name}`);
        } else {
          await this.repository.create(streamingTypeData);
          created++;
          logger.info(`Created streaming type: ${streamingTypeData.name}`);
        }
      }

      logger.info(`Streaming types synchronization completed. Created: ${created}, Updated: ${updated}`);
      return { created, updated };

    } catch (error: any) {
      logger.error({
        message: 'Error synchronizing streaming types with genres',
        error: error.message,
      });
      throw new StreamingServiceError('Error synchronizing streaming types with genres', 500);
    }
  }
}

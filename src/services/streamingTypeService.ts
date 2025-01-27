import { StreamingServiceError } from '../middleware/errorHandler';
import {
  IStreamingTypeCreate,
  IStreamingTypeUpdate,
  ICategory,
  IStreamingTypeResponse,
} from '../interfaces/streamingTypes';
import logger from '../config/logger';
import { IStreamingType } from '../models/streamingTypesModel';
import { IStreamingTypeService } from '../interfaces/services';
import { StreamingTypeRepository } from '../repositories/streamingTypeRepository';
import { ErrorMessages } from '../constants/errorMessages';
import axios from 'axios';

export class StreamingTypeService implements IStreamingTypeService {
  constructor(private repository: StreamingTypeRepository) {}

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

  async updateStreamingType(id: string, data: IStreamingTypeUpdate): Promise<IStreamingTypeUpdate> {
    if (data.name) {
      await this.checkDuplicateName(data.name, id);
    }

    const updatedType = await this.repository.update(id, data);
    if (!updatedType) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404);
    }

    return updatedType;
  }

  async deleteStreamingType(id: string): Promise<IStreamingTypeResponse | null> {
    const result = await this.repository.delete(id);
    if (!result) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404);
    }
    return result;
  }

  async addCategoryToStreamingType(id: string, category: ICategory[]): Promise<IStreamingTypeResponse | null> {
    const streamingType = await this.getStreamingTypeById(id);

    const existingIds = new Set(streamingType.categories.map((c) => c.id));
    const newCategories = category.filter((category) => !existingIds.has(category.id));
    
    if (newCategories.length === 0) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_CATEGORY_ALREADY_EXISTS, 400);
    }
    return this.repository.addCategory(id, newCategories);
  }

  async removeCategoryFromStreamingType(
    id: string,
    categoriesIds: Partial<ICategory>[],
  ): Promise<IStreamingTypeResponse | null> {
    const streamingType = await this.getStreamingTypeById(id);

    const invalidCategories = categoriesIds.filter(
      (categoryToRemove) =>
        !streamingType.categories.some((existingCategory) => existingCategory.id === categoryToRemove.id),
    );

    if (invalidCategories.length > 0) {
      throw new StreamingServiceError(
        `${ErrorMessages.STREAMING_TYPE_CATEGORY_NOT_FOUND}: ${invalidCategories.map((c) => c.id).join(', ')}`,
        404,
      );
    }

    return this.repository.removeCategory(id, categoriesIds);
  }

  async changeCover(): Promise<void> {
    const allStreamingTypes = await this.repository.findAll(0, 100);

    if (!process.env.TMDB_Bearer_Token || process.env.TMDB_Bearer_Token === '') {
      throw new StreamingServiceError('Invalid TMDB_Bearer_Token', 401);
    }
    // TODO make a upgrade to change all of the categories streaming in same time not only one each time
    const streamingTypeCategories = await Promise.all(allStreamingTypes[1].categories.map(async (categoryType: ICategory) => { 
      const url = `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc&without_genres=${categoryType.id}`;
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${process.env.TMDB_Bearer_Token}`,
        },
      };
      const response = await axios.get(url, options); // TODO use a instance of axios from project not the axios lib directly
      if (response.data.results.length > 0) {
        const poster = response.data.results[0].backdrop_path;
        const updatedCategory = {
          id: categoryType.id,
          name: categoryType.name,
          poster: `https://image.tmdb.org/t/p/original${poster}`         

        };
        return updatedCategory;
      } 
      return categoryType;
    }));

    const newStreamingTypes = {
      ...allStreamingTypes[0],
      categories: streamingTypeCategories,
    }

    const updatedType = await this.repository.update(newStreamingTypes._id, newStreamingTypes);
    if (!updatedType) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404);
    }
  }

  private async validateStreamingTypeData(data: Partial<IStreamingType>): Promise<void> {
    if (!data.name) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NAME_REQUIRED, 400);
    }

    if (!Array.isArray(data.categories) || data.categories.length === 0) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_CATEGORIES_REQUIRED, 400);
    }

    if (data.categories) {
      this.validateCategories(data.categories);
    }
  }

  private validateCategories(categories: ICategory[]): void {
    const ids = new Set();

    categories.forEach((category) => {
      if (!category.id || !category.name) {
        throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_INVALID_DATA, 400);
      }

      if (ids.has(category.id)) {
        throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_DUPLICATE_CATEGORY, 400);
      }

      ids.add(category.id);
    });
  }

  private async checkDuplicateName(name: string, excludeId?: string): Promise<void> {
    const existing = (await this.repository.findByName(name)) as IStreamingType | null;
    if (existing && (!excludeId || existing._id.toString() !== excludeId)) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NAME_EXISTS, 400);
    }
  }
}

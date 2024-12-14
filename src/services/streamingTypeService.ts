import { StreamingServiceError } from '../middleware/errorHandler';
import { IStreamingTypeRepository } from '../interfaces/repositories';
import { IStreamingTypeCreate, IStreamingTypeUpdate, ICategory, IStreamingTypeResponse } from '../interfaces/streamingTypes';
import logger from '../config/logger';
import { IStreamingType } from '../models/streamingTypesModel';

export class StreamingTypeService {
  constructor(private repository: IStreamingTypeRepository) {}

  async getAllStreamingTypes(skip = 0, limit = 10): Promise<IStreamingTypeResponse[]> {
    return this.repository.findAll(skip, limit);
  }

  async getStreamingTypeById(id: string): Promise<IStreamingTypeResponse> {
    const streamingType = await this.repository.findById(id);
    if (!streamingType) {
      logger.warn({
        message: 'Streaming type not found',
        streamingTypeId: id
      });
      throw new StreamingServiceError('Streaming type not found', 404);
    }
    return streamingType;
  }

  async createStreamingType(data: Partial<IStreamingType>): Promise<IStreamingTypeCreate> {
    await this.validateStreamingTypeData(data);
    await this.checkDuplicateName(data.name!);
    
    return this.repository.create(data);
  }

  async updateStreamingType(id: string, data: Partial<IStreamingType>): Promise<IStreamingTypeUpdate> {
    if (data.name) {
      await this.checkDuplicateName(data.name, id);
    }

    const updatedType = await this.repository.update(id, data);
    if (!updatedType) {
      throw new StreamingServiceError('Streaming type not found', 404);
    }

    return updatedType;
  }

  async deleteStreamingType(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (!result) {
      throw new StreamingServiceError('Streaming type not found', 404);
    }
  }
  
  async addCategoryToStreamingType(id: string, category: ICategory[]): Promise<IStreamingTypeResponse | null> {
    const streamingType = await this.getStreamingTypeById(id);
    if (!streamingType) {
      throw new StreamingServiceError('Streaming type not found', 404);
    }

    const existingIds = new Set(streamingType.categories.map(c => c.id));
    const newCategories = category.filter(category => !existingIds.has(category.id));
    
    if (newCategories.length === 0) {
      throw new StreamingServiceError('Categories already exist', 400);
    }
    return this.repository.addCategory(id, newCategories);
  }

  async removeCategoryFromStreamingType(id: string, categoriesIds: Partial<ICategory>[]): Promise<IStreamingTypeResponse | null> {
    const streamingType = await this.getStreamingTypeById(id);
    if (!streamingType) {
      throw new StreamingServiceError('Streaming type not found', 404);
    }
    
    const invalidCategories = categoriesIds.filter(categoryToRemove => 
      !streamingType.categories.some(existingCategory => 
        existingCategory.id === categoryToRemove.id
      )
    );

    if (invalidCategories.length > 0) {
      throw new StreamingServiceError(
        `Categories not found in streaming type: ${invalidCategories.map(c => c.id).join(', ')}`,
        404
      );
    }

    return this.repository.removeCategory(id, categoriesIds);
  }

  private async validateStreamingTypeData(data: Partial<IStreamingType>): Promise<void> {
    if (!data.name) {
      throw new StreamingServiceError('Name is required', 400);
    }

    if (!Array.isArray(data.categories) || data.categories.length === 0) {
      throw new StreamingServiceError('At least one category is required', 400);
    }

    if (data.categories) {
      this.validateCategories(data.categories);
    }
  }


  private validateCategories(categories: ICategory[]): void {
    const ids = new Set();
    
    categories.forEach(category => {
      if (!category.id || !category.name) {
        throw new StreamingServiceError('Invalid category data', 400);
      }
      
      if (ids.has(category.id)) {
        throw new StreamingServiceError('Duplicate category ID', 400);
      }
      
      ids.add(category.id);
    });
  }

  private async checkDuplicateName(name: string, excludeId?: string): Promise<void> {
    const existing = await this.repository.findByName(name) as IStreamingType | null;
    if (existing && (!excludeId || existing._id.toString() !== excludeId)) {
      throw new StreamingServiceError('Streaming type name already exists', 400);
    }
  }

} 
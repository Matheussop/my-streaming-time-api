import { StreamingServiceError } from '../middleware/errorHandler';
import {
  IStreamingTypeCreate,
  IStreamingTypeUpdate,
  IStreamingTypeResponse,
} from '../interfaces/streamingTypes';
import logger from '../config/logger';
import { IStreamingTypeService } from '../interfaces/services';
import { StreamingTypeRepository } from '../repositories/streamingTypeRepository';
import { ErrorMessages } from '../constants/errorMessages';

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
}

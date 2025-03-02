import { IStreamingTypeRepository } from '../interfaces/repositories';
import {
  IStreamingTypeResponse,
  IStreamingTypeCreate,
  IStreamingTypeUpdate
} from '../interfaces/streamingTypes';
import StreamingTypes from '../models/streamingTypesModel';

export class StreamingTypeRepository implements IStreamingTypeRepository {
  async findAll(skip: number, limit: number): Promise<IStreamingTypeResponse[]> {
    return (await StreamingTypes.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean());
  }

  async findById(id: string): Promise<IStreamingTypeResponse | null> {
    return StreamingTypes.findById(id);
  }

  async findByName(name: string): Promise<IStreamingTypeResponse | null> {
    return StreamingTypes.findByName(name);
  }

  async create(data: IStreamingTypeCreate): Promise<IStreamingTypeResponse> {
    const streamingType = new StreamingTypes(data);
    return streamingType.save();
  }

  async update(id: string, data: IStreamingTypeUpdate): Promise<IStreamingTypeResponse | null> {
    return StreamingTypes.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<IStreamingTypeResponse | null> {
    return StreamingTypes.findByIdAndDelete(id);
  }
}

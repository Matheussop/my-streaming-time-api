import { IStreamingTypeRepository } from '../interfaces/repositories';
import {
  IStreamingTypeResponse,
  IStreamingTypeCreate,
  IStreamingTypeUpdate,
  IGenreReference
} from '../interfaces/streamingTypes';
import StreamingTypes from '../models/streamingTypesModel';
import { Types } from 'mongoose';
export class StreamingTypeRepository implements IStreamingTypeRepository {
  async findAll(skip: number, limit: number): Promise<IStreamingTypeResponse[]> {
    return await StreamingTypes.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  }

  async findById(id: string | Types.ObjectId): Promise<IStreamingTypeResponse | null> {
    return StreamingTypes.findById(id);
  }

  async findByName(name: string): Promise<IStreamingTypeResponse | null> {
    return StreamingTypes.findByName(name);
  }

  async create(data: IStreamingTypeCreate): Promise<IStreamingTypeResponse> {
    return StreamingTypes.create(data);
  }

  async update(id: string | Types.ObjectId, data: IStreamingTypeUpdate): Promise<IStreamingTypeResponse | null> {
    return StreamingTypes.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async addGenre(id: string | Types.ObjectId, genres: IGenreReference[]): Promise<IStreamingTypeResponse | null> {
    return StreamingTypes.findByIdAndUpdate(
      id, 
      { $addToSet: { supportedGenres: { $each: genres } } }, 
      { new: true, runValidators: true }
    );
  }

  async findByGenreName(genreName: string, id: string | Types.ObjectId): Promise<IStreamingTypeResponse | null> {
    return StreamingTypes.findByGenreName(genreName, id);
  }

  async deleteByGenresName(genresName: string[], id: string | Types.ObjectId): Promise<IStreamingTypeResponse | null> {
    return StreamingTypes.deleteByGenresName(genresName, id);
  }

  async delete(id: string | Types.ObjectId): Promise<IStreamingTypeResponse | null> {
    return StreamingTypes.findByIdAndDelete(id);
  }
}

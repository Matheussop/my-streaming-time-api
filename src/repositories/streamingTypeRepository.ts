import { IStreamingTypeRepository } from '../interfaces/repositories';
import {
  IStreamingTypeResponse,
  IStreamingTypeCreate,
  IStreamingTypeUpdate,
  ICategory,
} from '../interfaces/streamingTypes';
import StreamingTypes from '../models/streamingTypesModel';

export class StreamingTypeRepository implements IStreamingTypeRepository {
  async findAll(skip = 0, limit = 10): Promise<IStreamingTypeResponse[]> {
    return StreamingTypes.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
  }

  async findById(id: string): Promise<IStreamingTypeResponse | null> {
    return StreamingTypes.findById(id);
  }

  async findByName(name: string): Promise<IStreamingTypeResponse | null> {
    return StreamingTypes.findOne({
      name: new RegExp(`^${name}$`, 'i'),
    });
  }
  
  async getIdGenreByGenreName(genre: string): Promise<number | null> {
    const result = await StreamingTypes.findOne({
      'categories.name': new RegExp(`^${genre}$`, 'i'),
    },{
      _id: 0,
      'categories.$': 1,
    }).lean();

    return result?.categories?.[0]?.id || null;
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

  async addCategory(id: string, category: ICategory[]): Promise<IStreamingTypeResponse | null> {
    return StreamingTypes.findByIdAndUpdate(
      id,
      { $addToSet: { categories: category } },
      { new: true, runValidators: true },
    );
  }

  async removeCategory(id: string, categories: Partial<ICategory>[]): Promise<IStreamingTypeResponse | null> {
    const categoryIds = categories.map((category) => category.id);

    return StreamingTypes.findByIdAndUpdate(id, { $pull: { categories: { id: { $in: categoryIds } } } }, { new: true });
  }
}

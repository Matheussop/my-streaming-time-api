import { ISeasonRepository } from "../interfaces/repositories";
import { ISeasonResponse, ISeasonCreate, ISeasonUpdate } from "../interfaces/series/season";
import Season from "../models/series/season";
import { Types } from "mongoose";
export class SeasonRepository implements ISeasonRepository {
  async findBySeriesId(seriesId: string | Types.ObjectId, skip: number, limit: number): Promise<ISeasonResponse[] | null> {
    return Season.findBySeriesId(seriesId, skip, limit) as unknown as ISeasonResponse[];
  }

  async findAll(skip: number, limit: number): Promise<ISeasonResponse[]> {
    return Season.find().sort({ releaseDate: -1 }).skip(skip).limit(limit) as unknown as ISeasonResponse[];
  }

  async findById(id: string | Types.ObjectId): Promise<ISeasonResponse | null> {
    return Season.findById(id) as unknown as ISeasonResponse | null;
  } 

  async create(data: ISeasonCreate): Promise<ISeasonResponse> {
    return Season.create(data) as unknown as ISeasonResponse;
  }
  
  async update(id: string | Types.ObjectId, data: ISeasonUpdate): Promise<ISeasonResponse | null> {
    return Season.findByIdAndUpdate(id, data, { new: true }) as unknown as ISeasonResponse | null;
  }

  async delete(id: string | Types.ObjectId): Promise<ISeasonResponse | null> {
    return Season.findByIdAndDelete(id) as unknown as ISeasonResponse | null;
  }
}


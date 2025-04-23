import { ISeasonRepository } from "../interfaces/repositories";
import { ISeasonResponse, ISeasonCreate, ISeasonUpdate, SeasonStatus } from "../interfaces/series/season";
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
    return Season.findById(id).lean() as unknown as ISeasonResponse | null;
  } 

  async findEpisodesBySeasonNumber(seriesId: string | Types.ObjectId, seasonNumber: number): Promise<ISeasonResponse | null> {
    return Season.findEpisodesBySeasonNumber(seriesId, seasonNumber) as unknown as ISeasonResponse;
  }

  async create(data: ISeasonCreate | ISeasonCreate[]): Promise<ISeasonResponse | ISeasonResponse[]> {
    return Season.create(data) as unknown as ISeasonResponse | ISeasonResponse[];
  }
  
  async update(id: string | Types.ObjectId, data: ISeasonUpdate): Promise<ISeasonResponse | null> {
    return Season.findByIdAndUpdate(id, data, { new: true }) as unknown as ISeasonResponse | null;
  }

  async delete(id: string | Types.ObjectId): Promise<ISeasonResponse | null> {
    return Season.findByIdAndDelete(id) as unknown as ISeasonResponse | null;
  }

  async findByStatus(statuses: SeasonStatus[]): Promise<ISeasonResponse[]> {
    return Season.findByStatus(statuses) as unknown as ISeasonResponse[];
  }

  async findPopularSeasons(threshold: number = 50): Promise<ISeasonResponse[]> {
    return Season.findPopularSeasons(threshold) as unknown as ISeasonResponse[];
  }

  async updateSeasonAccessCount(seasonId: string | Types.ObjectId): Promise<ISeasonResponse | null> {
    return Season.findByIdAndUpdate(seasonId, { $inc: { accessCount: 1 }, lastAccessed: new Date() }, { new: true }) as unknown as ISeasonResponse | null;
  }
}


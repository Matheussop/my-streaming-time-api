import { ISeasonCreate, ISeasonResponse, ISeasonUpdate } from "../interfaces/series/season";
import { ISeasonService } from "../interfaces/services";
import { SeasonRepository } from "../repositories/seasonRepository";
import { Types } from "mongoose";
export class SeasonService implements ISeasonService {
  constructor(private seasonRepository: SeasonRepository) {}

  async getSeasons(skip: number, limit: number): Promise<ISeasonResponse[] | null> {
    return this.seasonRepository.findAll(skip, limit);
  }

  async getSeasonsBySeriesId(seriesId: string | Types.ObjectId, skip: number, limit: number): Promise<ISeasonResponse[] | null> {
    return this.seasonRepository.findBySeriesId(seriesId, skip, limit);
  }

  async getSeasonById(id: string | Types.ObjectId): Promise<ISeasonResponse | null> {
    return this.seasonRepository.findById(id);
  }

  async createSeason(season: ISeasonCreate): Promise<ISeasonResponse> {
    return this.seasonRepository.create(season);
  }

  async updateSeason(id: string | Types.ObjectId, season: ISeasonUpdate): Promise<ISeasonResponse | null> {
    return this.seasonRepository.update(id, season);
  }

  async deleteSeason(id: string | Types.ObjectId): Promise<ISeasonResponse | null> {
    return this.seasonRepository.delete(id);
  }
}


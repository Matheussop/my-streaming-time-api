import { ISeasonCreate, ISeasonResponse, ISeasonUpdate } from "../interfaces/series/season";
import { ISeasonService } from "../interfaces/services";
import { SeasonRepository } from "../repositories/seasonRepository";

export class SeasonService implements ISeasonService {
  constructor(private seasonRepository: SeasonRepository) {}

  async getSeasons(skip: number, limit: number): Promise<ISeasonResponse[] | null> {
    return this.seasonRepository.findAll(skip, limit);
  }

  async getSeasonsBySeriesId(seriesId: string, skip: number, limit: number): Promise<ISeasonResponse[] | null> {
    return this.seasonRepository.findBySeriesId(seriesId, skip, limit);
  }

  async getSeasonById(id: string): Promise<ISeasonResponse | null> {
    return this.seasonRepository.findById(id);
  }

  async createSeason(season: ISeasonCreate): Promise<ISeasonResponse> {
    return this.seasonRepository.create(season);
  }

  async updateSeason(id: string, season: ISeasonUpdate): Promise<ISeasonResponse | null> {
    return this.seasonRepository.update(id, season);
  }

  async deleteSeason(id: string): Promise<ISeasonResponse | null> {
    return this.seasonRepository.delete(id);
  }
}


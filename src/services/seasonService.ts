import { IEpisode, ISeasonCreate, ISeasonResponse, ISeasonUpdate } from "../interfaces/series/season";
import { ISeasonService } from "../interfaces/services";
import { SeasonRepository } from "../repositories/seasonRepository";
import { Types } from "mongoose";
import { TMDBService } from "./tmdbService";
import { SeasonCacheService } from "./seasonCacheService";
import logger from "../config/logger";

export class SeasonService implements ISeasonService {
  private seasonCacheService: SeasonCacheService;

  constructor(private seasonRepository: SeasonRepository, private tmdbService: TMDBService) {
    this.seasonCacheService = new SeasonCacheService(seasonRepository, tmdbService);
  }

  async getSeasons(skip: number, limit: number): Promise<ISeasonResponse[] | null> {
    return this.seasonRepository.findAll(skip, limit);
  }

  async getSeasonsBySeriesId(seriesId: string | Types.ObjectId, skip: number, limit: number): Promise<ISeasonResponse[] | null> {
    return this.seasonRepository.findBySeriesId(seriesId, skip, limit);
  }

  async getSeasonById(id: string | Types.ObjectId): Promise<ISeasonResponse | null> {
    return this.seasonRepository.findById(id);
  }

  async getEpisodesBySeasonNumber(seriesId: string | Types.ObjectId, seasonNumber: number): Promise<ISeasonResponse | null> {
    const season = await this.seasonRepository.findEpisodesBySeasonNumber(seriesId, seasonNumber);
    if (!season || !season.episodes || !season.episodeCount || !season.tmdbId) {
      return null;
    }

    // if the season has episodesCount but no episodes, we need to update the season info
    if (season.episodes.length <= 0 && season.episodeCount > 0) {
      const episodes = await this.updateSeasonInfo(season);
      if (!episodes) {
        return null;
      }
      const updatedSeason = await this.seasonRepository.update(season._id, { episodes });
      return updatedSeason;
    }

    // Check if the data needs to be updated based on the cache policies
    const needsUpdate = await this.seasonCacheService.shouldUpdateSeason(season);
    if (needsUpdate) {
      this.seasonCacheService.updateSeasonData(season)
        .then(success => {
          if (success) {
            logger.info({
              message: 'Season data updated successfully',
              seasonId: season._id
            });
          }
        })
        .catch(error => {
          logger.error({
            message: 'Error updating season data asynchronously',
            seasonId: season._id,
            error: error.message
          });
        });
    }

    return season;
  }

  async createSeason(season: ISeasonCreate | ISeasonCreate[]): Promise<ISeasonResponse | ISeasonResponse[]> {
    return this.seasonRepository.create(season);
  }

  async updateSeason(id: string | Types.ObjectId, season: ISeasonUpdate): Promise<ISeasonResponse | null> {
    return this.seasonRepository.update(id, season);
  }

  async deleteSeason(id: string | Types.ObjectId): Promise<ISeasonResponse | null> {
    return this.seasonRepository.delete(id);
  }

  private async updateSeasonInfo(season: ISeasonResponse): Promise<IEpisode[] | null> {
    const success = await this.seasonCacheService.updateSeasonData(season);
    if (success) {
      const updatedSeason = await this.seasonRepository.findById(season._id);
      return updatedSeason?.episodes || null;
    }
    return null;
  }
}


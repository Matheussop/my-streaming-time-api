import { IEpisode, ISeasonCreate, ISeasonResponse, ISeasonUpdate } from "../interfaces/series/season";
import { ISeasonService } from "../interfaces/services";
import { SeasonRepository } from "../repositories/seasonRepository";
import { Types } from "mongoose";
import { TMDBService } from "./tmdbService";
export class SeasonService implements ISeasonService {
  constructor(private seasonRepository: SeasonRepository, private tmdbService: TMDBService) {}

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
    const episodesData = await this.tmdbService.fetchEpisodes(season.tmdbId, season.seasonNumber);
    if (!episodesData) {
      return null;
    }
    const episodes: IEpisode[] = episodesData.episodes.map((episode: any) => {
      return {
        episodeNumber: episode.episode_number,
        title: episode.name,
        plot: episode.overview,
        durationInMinutes: episode.runtime,
        releaseDate: episode.air_date,
        poster: `https://image.tmdb.org/t/p/w500${episode.still_path}`,
      };
    });
    return episodes;
  }
}


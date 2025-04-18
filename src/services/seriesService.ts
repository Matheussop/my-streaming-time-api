import { Types } from "mongoose";
import logger from "../config/logger";
import { ErrorMessages } from "../constants/errorMessages";
import { ISeriesCreate, ISeriesUpdate } from "../interfaces/series/series";
import { ISeriesService } from "../interfaces/services";
import { StreamingServiceError } from "../middleware/errorHandler";
import { SeriesRepository } from "../repositories/seriesRepository";
import axios from 'axios';
import { TMDBService } from "./tmdbService";
import { ISeasonSummary } from "../interfaces/series/series";
import { SeasonRepository } from "../repositories/seasonRepository";
import { ISeasonCreate, ISeasonResponse } from "../interfaces/series/season";

export class SeriesService implements ISeriesService {
  constructor(
    private seriesRepository: SeriesRepository,
    private seasonRepository: SeasonRepository,
    private tmdbService: TMDBService
  ) { }

  async getSeries(skip: number, limit: number){
    return this.seriesRepository.findAll(skip, limit);
  }

  async getSeriesById(id: string | Types.ObjectId) {
    const serie = await this.seriesRepository.findById(id)
    if (!serie) {
      logger.warn({
        message: 'Serie not found',
        serieId: id,
      });
      throw new StreamingServiceError(ErrorMessages.SERIE_NOT_FOUND, 404);
    }

    // If the serie has no totalSeasons, it means it was not updated from TMDB yet.
    if (!serie.totalSeasons && serie.tmdbId) {
      const tmdbData = await this.tmdbService.fetchDataFromTMDB(serie.tmdbId, "series");
      serie.totalSeasons = tmdbData.number_of_seasons;
      serie.totalEpisodes = tmdbData.number_of_episodes;
      serie.videoUrl = this.getTrailerUrl(tmdbData.videos.results);
      const seasonsSummary = await this.processSeasonsSummary(tmdbData.seasons, serie._id, serie.tmdbId);
      serie.seasonsSummary = seasonsSummary;
      await this.seriesRepository.update(id, serie);
    }
    return serie;
  }

  async getSeriesByTMDBId(tmdbId: number[]) {
    const series = await this.seriesRepository.findByTMDBId(tmdbId);
    return series;
  }

  async getSeriesByTitle(title: string, skip: number, limit: number) {
    const series = await this.seriesRepository.findByTitle(title, skip, limit);
    if (!series || series.length <= 0) {
      logger.warn({
        message: 'Series not found',
        title: title,
      });
    }
    return series
  }

  async getSeriesByGenre(genre: string, skip: number, limit: number) {
    const series = await this.seriesRepository.findByGenre(genre, skip, limit);
    if (!series || series.length <= 0) {
      logger.warn({
        message: 'Series not found',
        genre: genre,
      });
    }
    return series;
  }

  async createManySeries(seriesArray: ISeriesCreate[], skipCheckTitle: boolean) {
    const processedData: ISeriesCreate[] = (
      await Promise.all(
        seriesArray.map(async (serieObj: ISeriesCreate) => {
          const obj = await this.processCreateData(serieObj)
          if (!skipCheckTitle){
            const isDuplicate = await this.checkDuplicateTitle(obj.title);
            if (isDuplicate) {
              return null
            }
          }
          return obj;
        })
      )
    ).filter((item): item is ISeriesCreate => item !== null);

    return this.seriesRepository.create(processedData)
  }

  async createSerie(serieData: ISeriesCreate) {
    const processedData: ISeriesCreate = await this.processCreateData(serieData);

    await this.checkDuplicateTitle(processedData.title, true);

    return this.seriesRepository.create(processedData)
  }

  async updateSerie(id: string | Types.ObjectId, updateData: ISeriesUpdate){
    const existingSerie = await this.seriesRepository.findById(id);

    if (!existingSerie) {
      logger.warn({
        message: 'Serie not found for update',
        serieId: id,
      });
      throw new StreamingServiceError(ErrorMessages.SERIE_NOT_FOUND, 404);
    }

    // If updating the title, check for duplicates
    if (updateData.title && updateData.title !== existingSerie.title) {
      await this.checkDuplicateTitle(updateData.title, true);
    }
    const processedUpdate = await this.processUpdateData(updateData);

    return this.seriesRepository.update(id, processedUpdate);
  }

  async deleteSerie(id: string | Types.ObjectId){
    const deletedSerie = await this.seriesRepository.delete(id);
    if (!deletedSerie) {
      logger.warn({
        message: 'Serie not found for delete',
        serieId: id,
      });
      throw new StreamingServiceError(ErrorMessages.SERIE_NOT_FOUND, 404);
    }
    return deletedSerie;
  }

  async fetchAndSaveExternalSeries() {
    // Make the external API request
    const url = 'https://api.themoviedb.org/3/tv/popular?language=pt-BR&page=1';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_Bearer_Token}`,
      },
    };
    const response = await axios.get(url, options);

    const externalSeries = response.data.results;
    const externalSeriesMinusInternalSeries = await Promise.all(
      externalSeries.map(async (externalSerie: any) => {
      const existingSeries = await this.seriesRepository.findByTitle(externalSerie.name, 0, 1);
      return existingSeries && existingSeries.length === 0 ? externalSerie : null;
      })
    ).then(results => results.filter(serie => serie !== null));
    
    const newSeries = externalSeriesMinusInternalSeries
      .map((externalSerie: any) => ({
        tmdbId: externalSerie.id,
        title: externalSerie.name,
        releaseDate: this.validateReleaseDate(externalSerie.first_air_date),
        plot: externalSerie.overview,
        rating: externalSerie.vote_average,
        genre: externalSerie.genre_ids,
        cast: [],
        totalEpisodes: externalSerie.number_of_episodes || 0,
        totalSeasons: externalSerie.number_of_seasons || 0,
        poster: `https://image.tmdb.org/t/p/original${externalSerie.backdrop_path}`,
        url: `https://image.tmdb.org/t/p/w500${externalSerie.poster_path}`,
      }));
    
    if (newSeries.length > 0) {
      return await this.seriesRepository.create(newSeries);
    } else {
      return null;
    }
  }

  private async checkDuplicateTitle(title: string, showError = false) {
    const series = await this.seriesRepository.findByTitle(title, 0, 1);
    if (series && series.length > 0) {
      if (showError) {
        throw new StreamingServiceError(ErrorMessages.SERIES_WITH_TITLE_EXISTS, 400);
      } else {
        return true
      }
    }
  }

  private validateRating(rating: any): number {
    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 0 || numRating > 10) {
      throw new StreamingServiceError(ErrorMessages.SERIES_RATING_INVALID, 400);
    }
    return numRating;
  }

  private validateReleaseDate(date: string): string {
    if (date == '') {
      return 'Without release date'
    }

    const releaseDate = new Date(date);
    if (isNaN(releaseDate.getTime())) {
      throw new StreamingServiceError(ErrorMessages.SERIES_RELEASE_DATE_INVALID, 400);
    }
    //Return date without time
    return releaseDate.toISOString().split('T')[0];
  }

  private validateURL(url: string, value: boolean = true): string {
    return url
  }

  private processCastList(cast: any[]): string[] {
    if (!Array.isArray(cast)) {
      throw new StreamingServiceError(ErrorMessages.SERIES_CAST_INVALID, 400);
    }
    return cast.map((actor) => actor.trim());
  }

  private async processUpdateData(data: any) {
    const processed: any = {};
    if (data.title) processed.title = data.title.trim();
    if (data.rating) processed.rating = this.validateRating(data.rating);
    if (data.hasOwnProperty('releaseDate')) processed.releaseDate = this.validateReleaseDate(data.releaseDate);
    if (data.genre) processed.genre = data.genre;
    if (data.url) processed.url = this.validateURL(data.url);
    if (data.cast) processed.cast = this.processCastList(data.cast);
    if (data.plot) processed.plot = data.plot;
    if (data.totalEpisodes) processed.totalEpisodes = data.totalEpisodes;
    if (data.totalSeasons) processed.totalSeasons = data.totalSeasons;
    if (data.poster) processed.poster = this.validateURL(data.poster);
    if (data.status) processed.status = data.status;
    if (data.tmdbId) processed.tmdbId = data.tmdbId;
    if (data.seasonsSummary) processed.seasonsSummary = data.seasonsSummary;
    
    return processed;
  }

  private async processCreateData(data: ISeriesCreate): Promise<ISeriesCreate> {
    return {
      title: data.title.trim(),
      releaseDate: data.releaseDate ? this.validateReleaseDate(data.releaseDate) : 'Without release date',
      plot: data.plot,
      cast: data.cast,
      genre: data.genre,
      tmdbId: data.tmdbId,
      totalEpisodes: data.totalEpisodes,
      totalSeasons: data.totalSeasons,
      rating: this.validateRating(data.rating),
      poster: this.validateURL(data.poster || ''),
      url: this.validateURL(data.url || ''),
    }
  }
  
  private getTrailerUrl(trailers: any[]): string {
    return trailers.find((trailer) => trailer.type === 'Trailer')?.key || '';
  }

  private async processSeasonsSummary(seasons: any[], seriesId: Types.ObjectId, tmdbId: number): Promise<ISeasonSummary[]> {
    const seasonsFormatted = this.formatSeasonsSummary(seasons, seriesId, tmdbId);
    const seasonsSummary = await this.seasonRepository.create(seasonsFormatted);
    return this.mapToSeasonSummary(seasonsSummary);
  }

  private mapToSeasonSummary(seasonsSummary: ISeasonResponse | ISeasonResponse[]):  | ISeasonSummary[] {
    if (Array.isArray(seasonsSummary)) {
      return seasonsSummary.map(season => this.createSeasonSummary(season));
    }
    return [this.createSeasonSummary(seasonsSummary)];
  }

  private createSeasonSummary(season: ISeasonResponse): ISeasonSummary {
    return {
      seasonId: season._id,
      seasonNumber: season.seasonNumber,
      title: season.title,
      episodeCount: season.episodeCount || 0,
      releaseDate: season.releaseDate
    };
  }

  private formatSeasonsSummary(seasons: any[], seriesId: Types.ObjectId, tmdbId: number): ISeasonCreate[] {
    return seasons.map((season) => ({
      seriesId,
      title: season.name,
      tmdbId,
      plot: season.overview || 'Plot not available',
      seasonNumber: season.season_number,
      poster: `https://image.tmdb.org/t/p/original${season.poster_path}`,
      episodes: [],
      episodeCount: season.episode_count || 0,
      releaseDate: season.air_date || 'Without release date'
    }));
  }

}
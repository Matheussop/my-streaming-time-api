import logger from "../config/logger";
import { ErrorMessages } from "../constants/errorMessages";
import { ISeriesCreate, ISeriesUpdate } from "../interfaces/series";
import { ISeriesService } from "../interfaces/services";
import { StreamingServiceError } from "../middleware/errorHandler";
import { SeriesRepository } from "../repositories/seriesRepository";
import axios from 'axios';

export class SeriesService implements ISeriesService {
  constructor(
    private seriesRepository: SeriesRepository) { }

  async getSeries(skip: number, limit: number){
    return this.seriesRepository.findAll(skip, limit);
  }

  async getSeriesById(id: string) {
    const serie = this.seriesRepository.findById(id)
    if (!serie) {
      logger.warn({
        message: 'Serie not found',
        serieId: id,
      });
      throw new StreamingServiceError(ErrorMessages.SERIE_NOT_FOUND, 404);
    }
    return serie;
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

  async createManySeries(seriesArray: ISeriesCreate[], skipCheckTitle: boolean) {
    const processedData: ISeriesCreate[] = (
      await Promise.all(
        seriesArray.map(async (serieObj: ISeriesCreate) => {
          const obj = await this.processCreateData(serieObj)
          if (!skipCheckTitle){
            const isDuplicate = await this.checkDuplicateTitle(obj.title);
            if (!skipCheckTitle && isDuplicate) {
              return null
            }
          }
          return obj;
        })
      )
    ).filter((item): item is ISeriesCreate => item !== null);

    return this.seriesRepository.createManySeries(processedData)
  }

  async createSerie(serieData: ISeriesCreate) {
    const processedData: ISeriesCreate = await this.processCreateData(serieData);

    await this.checkDuplicateTitle(processedData.title, true);

    return this.seriesRepository.create(processedData)
  }

  async updateSerie(id: string, updateData: ISeriesUpdate){
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

  async deleteSerie(id: string){
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
        release_date: externalSerie.first_air_date,
        plot: externalSerie.overview,
        rating: externalSerie.vote_average,
        genre: externalSerie.genre_ids,
        cast: [],
        numberEpisodes: externalSerie.number_of_episodes || 0,
        numberSeasons: externalSerie.number_of_seasons || 0,
        poster: `https://image.tmdb.org/t/p/original${externalSerie.backdrop_path}`,
        url: `https://image.tmdb.org/t/p/w500${externalSerie.poster_path}`,
      }));
    
    if (newSeries.length > 0) {
      return await this.seriesRepository.createManySeries(newSeries);
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
      return date
    }

    const releaseDate = new Date(date);
    if (isNaN(releaseDate.getTime())) {
      throw new StreamingServiceError(ErrorMessages.SERIES_RELEASE_DATE_INVALID, 400);
    }
    //Return date without time
    return releaseDate.toISOString().split('T')[0];
  }

  private validateURL(url: string): string {
    try {
      // TODO For now the URL is accepted as is, but at some point it will need to be validated.
      return url;
    } catch {
      throw new StreamingServiceError(ErrorMessages.SERIES_URL_INVALID, 400);
    }
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
    if (data.release_date) processed.release_date = this.validateReleaseDate(data.release_date);
    if (data.genre) processed.genre = data.genre;
    if (data.url) processed.url = this.validateURL(data.url);
    if (data.cast) processed.cast = this.processCastList(data.cast);
    if (data.plot) processed.plot = data.plot;

    return processed;
  }

  private async processCreateData(data: ISeriesCreate): Promise<ISeriesCreate> {
    return {
      title: data.title.trim(),
      release_date: this.validateReleaseDate(data.release_date),
      plot: data.plot,
      cast: data.cast,
      genre: data.genre,
      numberEpisodes: data.numberEpisodes,
      numberSeasons: data.numberSeasons,
      rating: this.validateRating(data.rating),
      poster: this.validateURL(data.poster),
      url: this.validateURL(data.url),
    }
  }
}
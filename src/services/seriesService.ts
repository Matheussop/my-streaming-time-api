import logger from "../config/logger";
import { ErrorMessages } from "../constants/errorMessages";
import { ISeriesCreate } from "../interfaces/series";
import { ISeriesService } from "../interfaces/services";
import { StreamingServiceError } from "../middleware/errorHandler";
import Series from "../models/seriesModel";
import { SeriesRepository } from "../repositories/seriesRepository";

export class SeriesService implements ISeriesService {
  constructor(
    private seriesRepository: SeriesRepository) {}

  async getSeriesByTitle(title: string, skip: number, limit: number) {
    const series = await this.seriesRepository.findByTitle(title, skip, limit);
    if(!series || series.length <= 0){
      logger.warn({
        message: 'Series not found',
        title: title,
      });
    }
    return series
  }

  async createManySeries(seriesArray: ISeriesCreate[]){

    const processedData: ISeriesCreate[] = seriesArray.map((serieObj: ISeriesCreate) => {
      return new Series(
        {
          title: serieObj.title.trim(),
          release_date: this.validateReleaseDate(serieObj.release_date),
          plot: serieObj.plot,
          cast: serieObj.cast,
          genre: serieObj.genre,
          numberEpisodes: serieObj.numberEpisodes,
          numberSeasons: serieObj.numberSeasons,
          rating: this.validateRating(serieObj.rating),
          poster: this.validateURL(serieObj.poster),
          url: this.validateURL(serieObj.url),
        }
      )
    })
    return this.seriesRepository.createManySeries(processedData)
  }

  private validateRating(rating: any): number {
    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 0 || numRating > 10) {
      throw new StreamingServiceError(ErrorMessages.SERIES_RATING_INVALID, 400);
    }
    return numRating;
  }

  private validateReleaseDate(date: string): string {
    if (date == ''){
      return date
    }

    const releaseDate = new Date(date);
    if (isNaN(releaseDate.getTime())) {
      throw new StreamingServiceError(ErrorMessages.SERIES_RELEASE_DATE_INVALID, 400);
    }
    if (releaseDate > new Date()) {
      // TODO This may need to be removed in the future, as we will accept upcoming movie releases.
      throw new StreamingServiceError(ErrorMessages.SERIES_RELEASE_DATE_FUTURE, 400);
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
}
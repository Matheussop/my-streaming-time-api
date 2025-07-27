import { ISeriesCreate } from "../interfaces/series/series";
import { Request, Response } from 'express';
import logger from "../config/logger";
import { catchAsync } from "../util/catchAsync";
import { SeriesService } from '../services/seriesService';
import { StreamingServiceError } from '../middleware/errorHandler';
import axios from 'axios';
import { Messages } from "../constants/messages";
import { PaginationSchemaType, SeriesByTitleParamSchemaType } from "../validators";

export class SeriesController {
  skipCheckTitles: boolean = true;
  constructor(private seriesService: SeriesService){}

  getSeries = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query as unknown as PaginationSchemaType;
    const skip = (Number(page) - 1) * Number(limit);

    logger.info({
      message: 'Fetching series list',
      page,
      limit,
      skip,
      method: req.method,
      path: req.path,
    });

    const series = await this.seriesService.getSeries(skip, limit);
    res.status(200).json(series);
  });

  getSeriesByTitle = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { title, page = 1, limit = 10 } = req.query as unknown as SeriesByTitleParamSchemaType;
    const skip = (Number(page) - 1) * Number(limit);
    logger.info({
      message: 'Fetching series by title',
      title,
      method: req.method,
      path: req.path,
    });
    const series = await this.seriesService.getSeriesByTitle(title, skip, limit);
    if (series && series.length > 0) {
      res.status(200).json(series)
    } else {
      res.status(404).json({ message: "Series not found with the provided title" });
    }
  });

  getSerieById = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;
    logger.info({
      message: 'Fetching series by id',
      serieId: id,
      method: req.method,
      path: req.path,
    });

    const series = await this.seriesService.getSeriesById(id);
    
    res.status(200).json(series);
  });

  getSeriesByGenre = catchAsync(async (req: Request, res: Response) => {
    const { genre, page = 1, limit = 10 } = req.body;
    const skip = (Number(page) - 1) * Number(limit);

    logger.info({
      message: 'Fetching series by genre',
      genre,
      method: req.method,
      path: req.path,
    });

    const series = await this.seriesService.getSeriesByGenre(genre, skip, limit);
    res.status(200).json(series);
  });

  createManySeries = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Creating many series',
      seriesData: req.body,
      method: req.method,
      path: req.path,
    });

    const skipCheckTitles = false
    const newSeries = await this.seriesService.createManySeries(req.body.series, skipCheckTitles );
    res.status(201).json(newSeries);
  });

  findOrAddSerie = catchAsync(async (req: Request, res: Response) => {
    const { title, page = 1, limit = 10 } = req.body;
    const normalizedTitle = title.trim();
    const skip = (page - 1) * limit;

    logger.info({
      message: 'Searching for series in database',
      title: normalizedTitle,
      method: req.method,
      path: req.path,
    });

    const seriesFromDatabase = await this.seriesService.getSeriesByTitle(normalizedTitle, skip, limit);
    const totalCount = seriesFromDatabase?.length || 0;
    
    if (seriesFromDatabase && seriesFromDatabase.length > 0) {
      logger.info({
        message: 'Series found in database',
        path: req.path,
        method: req.method,
        seriesCount: seriesFromDatabase.length,
      });

      return res.status(200).json({
        page,
        limit,
        total: totalCount,
        series: seriesFromDatabase,
        hasMore: skip + seriesFromDatabase.length < totalCount
      });
    }

    try {
      logger.info({
        message: 'Searching for series in external API',
        title: normalizedTitle,
        method: req.method,
        path: req.path,
      });

      const tmdbPage = Math.max(1, Math.floor(skip / limit) + 1);
      const externalSeries = await this.fetchExternalSeries(normalizedTitle, tmdbPage);
      
      if (!externalSeries || externalSeries.length === 0) {
        return res.status(200).json({
          page,
          limit,
          total: totalCount,
          series: seriesFromDatabase,
          hasMore: false
        });
      }

      const existingTmdbIds = await this.seriesService.getSeriesByTMDBId(externalSeries.map((serie: any) => serie.tmdbId));
      
      const existingIds = existingTmdbIds?.map((serie: any) => serie.tmdbId) || [];
      
      const newSeries = externalSeries.filter(externalSerie => 
        !existingIds.includes(externalSerie.tmdbId)
      );

      if (newSeries.length > 0) {
        logger.info({
          message: 'Saving new series to database',
          count: newSeries.length,
          method: req.method,
          path: req.path,
        });
      
        await this.seriesService.createManySeries(
          newSeries, 
          this.skipCheckTitles
        );
        
        const updatedSeriesFromDatabase = await this.seriesService.getSeriesByTitle(normalizedTitle, skip, limit);
        const updatedTotalCount = updatedSeriesFromDatabase?.length || 0;
        
        return res.status(200).json({
          page,
          limit,
          total: updatedTotalCount,
          series: updatedSeriesFromDatabase || [],
          hasMore: skip + (updatedSeriesFromDatabase?.length || 0) < updatedTotalCount
        });
      } else {
        return res.status(200).json({
          page,
          limit,
          total: totalCount,
          series: seriesFromDatabase || [],
          hasMore: false
        });
      }
    } catch (error) {

      return res.status(200).json({
        page,
        limit,
        total: 0,
        series: [],
        hasMore: false
      });
      
    }
  });

  private async fetchExternalSeries(title: string, page: number): Promise<ISeriesCreate[]> {
    if (!process.env.TMDB_Bearer_Token || process.env.TMDB_Bearer_Token === '') {
      throw new StreamingServiceError('Invalid TMDB_Bearer_Token', 401);
    }

    const encodedQueryParams = encodeURIComponent(title);
    const url = `https://api.themoviedb.org/3/search/tv?query=${encodedQueryParams}&include_adult=false&language=pt-BR&page=${page}`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_Bearer_Token}`,
      },
    };

    const response = await axios.get(url, options);
    
    if (!response.data.results || response.data.results.length === 0) {
      return [];
    }
    
    return response.data.results.map((externalSerie: any) => ({
      title: externalSerie.name,
      releaseDate: externalSerie.first_air_date,
      plot: externalSerie.overview,
      rating: externalSerie.vote_average,
      genre: externalSerie.genre_ids,
      numberEpisodes: externalSerie.number_of_episodes || 0,
      numberSeasons: externalSerie.number_of_seasons || 0,
      poster: externalSerie.backdrop_path ? `https://image.tmdb.org/t/p/original${externalSerie.backdrop_path}` : null,
      url: externalSerie.poster_path ? `https://image.tmdb.org/t/p/w500${externalSerie.poster_path}` : null,
      tmdbId: externalSerie.id,
    }));
  }

  createSeries = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Creating a serie',
      serieData: req.body,
      method: req.method,
      path: req.path,
    });

    const newSerie = await this.seriesService.createSerie(req.body);
    res.status(201).json(newSerie);
  });

  updateSerie = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;
    
    logger.info({
      message: 'Updating serie',
      serieId: id,
      updateData: req.body,
      method: req.method,
      path: req.path,
    });

    const serie = await this.seriesService.updateSerie(id, req.body);
    res.status(200).json(serie);
  });

  deleteSerie = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;

    logger.info({
      message: 'Deleting a serie',
      seriesData: req.body,
      method: req.method,
      path: req.path,
    });

    await this.seriesService.deleteSerie(id);

    res.status(200).json({ message: Messages.SERIE_DELETED_SUCCESSFULLY})
  });

  fetchAndSaveExternalSeries = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Saved a new series',
      seriesData: req.body,
      method: req.method,
      path: req.path,
    });
     
    const savedSeries = await this.seriesService.fetchAndSaveExternalSeries();
    res.status(201).json(savedSeries);
  });
}
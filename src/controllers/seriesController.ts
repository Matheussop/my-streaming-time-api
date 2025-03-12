import { ISeriesCreate } from "../interfaces/series/series";
import { Request, Response } from 'express';
import logger from "../config/logger";
import { catchAsync } from "../util/catchAsync";
import { SeriesService } from '../services/seriesService';
import { StreamingServiceError } from '../middleware/errorHandler';
import axios from 'axios';
import { ErrorMessages } from '../constants/errorMessages';
import { Messages } from "../constants/messages";
import { PaginationSchemaType } from "../validators";

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
    const { title, page = 1, limit = 10 } = req.body;
    const skip = (Number(page) - 1) * Number(limit);
    logger.info({
      message: 'Fetching series by title',
      title,
      method: req.method,
      path: req.path,
    });

    const series = await this.seriesService.getSeriesByTitle(title, skip, limit);
    res.status(200).json(series);
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
    
    if (!title || typeof title !== 'string' || title.trim() === '') {
      logger.warn({
        message: 'Invalid title parameter',
        path: req.path,
        method: req.method,
      });
      throw new StreamingServiceError(ErrorMessages.SERIES_TITLE_REQUIRED, 400);
    }
    
    const normalizedTitle = title.trim();
    const skip = (page - 1) * limit;

    logger.info({
      message: 'Searching for series in database',
      title: normalizedTitle,
      method: req.method,
      path: req.path,
    });
    
    const seriesFromDatabase = await this.seriesService.getSeriesByTitle(normalizedTitle, 0, 100);
    
    if (seriesFromDatabase && seriesFromDatabase.length >= 5) {
      logger.info({
        message: 'Series already exist in database with this parameter',
        path: req.path,
        method: req.method,
        seriesCount: seriesFromDatabase.length,
      });
      
      return res.status(200).json({
        page,
        limit,
        total: seriesFromDatabase.length,
        series: seriesFromDatabase,
      });
    }

    try {
      logger.info({
        message: 'Searching for series in external API',
        title: normalizedTitle,
        method: req.method,
        path: req.path,
      });
      
      const externalSeries = await this.fetchExternalSeries(normalizedTitle, page);
      
      if (!externalSeries || externalSeries.length === 0) {
        return res.status(200).json({
          page,
          limit,
          total: seriesFromDatabase?.length || 0,
          series: seriesFromDatabase || [],
        });
      }
      
      // Filtrar séries que já existem no banco
      const existingTitles = seriesFromDatabase?.map(series => series.title) || [];
      const newSeries = externalSeries.filter(externalSerie => 
        !existingTitles.includes(externalSerie.title)
      );
      
      if (newSeries.length > 0) {
        logger.info({
          message: 'Saving new series to database',
          count: newSeries.length,
          method: req.method,
          path: req.path,
        });
        
        const savedSeries = await this.seriesService.createManySeries(
          newSeries, 
          this.skipCheckTitles
        );
        
        const allSeries = [...(seriesFromDatabase || []), ...(Array.isArray(savedSeries) ? savedSeries : [savedSeries])];
        const paginatedSeries = allSeries.slice(skip, skip + limit);
        
        return res.status(200).json({
          page,
          limit,
          total: allSeries.length,
          series: paginatedSeries,
        });
      } else {
        return res.status(200).json({
          page,
          limit,
          total: seriesFromDatabase?.length || 0,
          series: seriesFromDatabase || [],
        });
      }
    } catch (error) {
      logger.error({
        message: 'Error fetching series from external API',
        error: error instanceof Error ? error.message : String(error),
        method: req.method,
        path: req.path,
      });
      
      if (seriesFromDatabase && seriesFromDatabase.length > 0) {
        return res.status(200).json({
          page,
          limit,
          total: seriesFromDatabase.length,
          series: seriesFromDatabase,
        });
      }
      
      throw new StreamingServiceError('Error fetching series from external API', 500);
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
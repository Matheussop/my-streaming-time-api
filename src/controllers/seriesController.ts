import { ISeriesCreate } from "./../interfaces/series";
import { Request, Response } from 'express';
import logger from "../config/logger";
import { catchAsync } from "../util/catchAsync";
import { SeriesService } from '../services/seriesService';
import { StreamingServiceError } from '../middleware/errorHandler';
import axios from 'axios';
import { ErrorMessages } from '../constants/errorMessages';
import Series from "../models/seriesModel";

export class SeriesController {
  constructor(private seriesService: SeriesService){}

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

  createManySeries = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Creating many series',
      movieData: req.body,
      method: req.method,
      path: req.path,
    });

    if (!req.body || Object.keys(req.body).length === 0) {
      logger.warn({
        message: 'Request body is missing',
        method: req.method,
        path: req.path,
      });
      throw new StreamingServiceError(ErrorMessages.BODY_REQUIRED, 400);
    }

    const seriesArray: ISeriesCreate[] = req.body.series;

    const newSeries = await this.seriesService.createManySeries(seriesArray);
    res.status(201).json(newSeries);
  })

  findOrAddMovie = catchAsync(async (req: Request, res: Response) => {
    const { title, page = 1, limit = 10 } = req.body;
    const skip = (page - 1) * limit;

    const seriesDataBase = await this.seriesService.getSeriesByTitle(title, skip, limit)
    
    if(seriesDataBase && seriesDataBase?.length > 5){
      logger.info({
        message: 'Movie already existed in database with this parameter',
        path: req.path,
        movieData: req.body,
        method: req.method,
      })
      res.status(200).json({
        page,
        limit,
        total: seriesDataBase.length,
        series: seriesDataBase,
      });
    }

    if (!process.env.TMDB_Bearer_Token || process.env.TMDB_Bearer_Token === '') {
      throw new StreamingServiceError('Invalid TMDB_Bearer_Token', 401);
    }

    const encodedQueryParams = encodeURIComponent(title.trim());
    const url = `https://api.themoviedb.org/3/search/tv?query=${encodedQueryParams}&include_adult=false&language=pt-BR&page=${page}`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_Bearer_Token}`,
      },
    };
    const response = await axios.get(url, options);
    if (response.data.results.length > 0) {
      const externalSeries = response.data.results.map((externalSerie: any) => ({
        title: externalSerie.name,
        release_date: externalSerie.first_air_date,
        plot: externalSerie.overview,
        rating: externalSerie.vote_average,
        genre: externalSerie.genre_ids,
        numberEpisodes: externalSerie.number_of_episodes || 0,
        numberSeasons: externalSerie.number_of_seasons || 0,
        poster: `https://image.tmdb.org/t/p/w500${externalSerie.backdrop_path}`,
        url: `https://image.tmdb.org/t/p/w500${externalSerie.poster_path}`,
      }));

      const existingTitles = seriesDataBase?.map((series) => series.title);

      const newSeries = externalSeries.filter((externalSerie: any) => !existingTitles?.includes(externalSerie.title));

      if (newSeries.length > 0) {
        const savedSeries = await this.seriesService.createManySeries(newSeries);
        res.status(200).json({
          page,
          limit,
          total: savedSeries.length,
          movies: savedSeries,
        });
      } else {
        res.status(200).json({
          page,
          limit,
          total: externalSeries.length,
          movies: externalSeries,
        });
      }
    } else {
      throw new StreamingServiceError('Series not found', 404);
    }

  })
}
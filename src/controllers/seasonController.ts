import { Request, Response } from "express";
import { SeasonService } from "../services/seasonService";
import { catchAsync } from "../util/catchAsync";
import logger from "../config/logger";

export class SeasonController {
  constructor(private seasonService: SeasonService) {}

  getSeasons = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.body;
    const skip = (Number(page) - 1) * Number(limit);

    logger.info({
      message: 'Fetching seasons',
      page,
      limit,
      skip,
      method: req.method,
      path: req.path,
    });

    const seasons = await this.seasonService.getSeasons(skip, limit);
    res.status(200).json(seasons);
  });
  
  
  getSeasonsBySeriesId = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.body;
    const skip = (Number(page) - 1) * Number(limit);
    const seriesId = req.validatedIds.seriesId;

    logger.info({
      message: 'Fetching seasons by series id',
      seriesId,
      page,
      limit,
      skip,
      method: req.method,
      path: req.path,
    });

    const seasons = await this.seasonService.getSeasonsBySeriesId(seriesId, skip, limit);
    res.status(200).json(seasons);
  });

  getSeasonById = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;

    logger.info({
      message: 'Fetching season by id',
      id,
      method: req.method,
      path: req.path,
    });

    const season = await this.seasonService.getSeasonById(id);
    res.status(200).json(season);
  });

  getEpisodesBySeasonNumber = catchAsync(async (req: Request, res: Response) => {
    const seriesId = req.validatedIds.seriesId;
    const seasonNumber = req.params.seasonNumber;
    logger.info({
      message: 'Fetching episodes by season number',
      seriesId,
      seasonNumber,
      method: req.method,
      path: req.path,
    });

    const episodes = await this.seasonService.getEpisodesBySeasonNumber(seriesId, Number(seasonNumber));
    if (!episodes) {
      return res.status(404).json({ message: 'Episodes not found' });
    }
    res.status(200).json(episodes);
  });


  createSeason = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Creating season',
      seasonData: req.body,
      method: req.method,
      path: req.path,
    });

    const season = await this.seasonService.createSeason(req.body);
    res.status(201).json(season);
  });

  updateSeason = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;

    logger.info({
      message: 'Updating season',
      id,
      method: req.method,
      path: req.path,
    });

    const season = await this.seasonService.updateSeason(id, req.body);
    res.status(200).json(season);
  });

  deleteSeason = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;

    logger.info({
      message: 'Deleting season',
      id,
      method: req.method,
      path: req.path,
    }); 

    const season = await this.seasonService.deleteSeason(id);
    res.status(200).json(season);
  });
}
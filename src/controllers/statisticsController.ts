import { Request, Response } from 'express';
import logger from "../config/logger";
import { StatisticsService } from "../services/statisticsService";
import { catchAsync } from "../util/catchAsync";
import { UserStreamingHistoryService } from '../services/userStreamingHistoryService';

export class StatisticsController {
  constructor(private service: StatisticsService, private userStreamingHistoryService: UserStreamingHistoryService) {}

  getWatchTimeStats = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;
    logger.info({
      message: 'Fetching watch time stats',
      id,
      method: req.method,
      path: req.path,
    });

    const userData = await this.userStreamingHistoryService.getUserHistory(id);

    const watchTimeStats = await this.service.getWatchTimeStats(userData);
    res.status(200).json(watchTimeStats);
  });


  getContentTypeDistribution = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;
    logger.info({
      message: 'Fetching content type distribution',
      id,
      method: req.method,
      path: req.path,
    });

    const userData = await this.userStreamingHistoryService.getUserHistory(id);
    const contentTypeDistribution = await this.service.getContentTypeDistribution(userData);
    res.status(200).json(contentTypeDistribution);
  });

  getSeriesProgressStats = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;
    logger.info({
      message: 'Fetching series progress stats',
      id,
      method: req.method,
      path: req.path,
    });

    const userData = await this.userStreamingHistoryService.getUserHistory(id);
    const seriesProgressStats = await this.service.getSeriesProgressStats(userData);
    res.status(200).json(seriesProgressStats);
  });

  getGenrePreferences = catchAsync(async (req: Request, res: Response) => { 
    const id = req.validatedIds.id;
    logger.info({
      message: 'Fetching genre preferences',
      id,
      method: req.method,
      path: req.path, 
    });

    const userData = await this.userStreamingHistoryService.getUserHistory(id);
    const genrePreferences = await this.service.getGenrePreferences(userData);
    res.status(200).json(genrePreferences);
  });

  getWatchingPatterns = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;
    logger.info({
      message: 'Fetching watching patterns',
      id,
      method: req.method,
      path: req.path, 
    });

    const userData = await this.userStreamingHistoryService.getUserHistory(id);
    const watchingPatterns = await this.service.getWatchingPatterns(userData);
    res.status(200).json(watchingPatterns);
  });

  getAllStats = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;
    logger.info({
      message: 'Fetching all stats',
      id,
      method: req.method,
      path: req.path,
    });

    const userData = await this.userStreamingHistoryService.getUserHistory(id);
    const allStats = await this.service.getAllStats(userData);
    res.status(200).json(allStats);
  });
} 
import { Request, Response } from 'express';
import { catchAsync } from '../util/catchAsync';
import logger from '../config/logger';
import { UserStreamingHistoryService } from '../services/userStreamingHistoryService';

export class UserStreamingHistoryController {
  constructor(private service: UserStreamingHistoryService) {}

  getUserStreamingHistory = catchAsync(async (req: Request, res: Response) => {
    const userId = req.validatedIds.userId;
    
    logger.info({
      message: 'Fetching user streaming history',
      userId: userId,
      method: req.method,
      path: req.path,
    });

    const history = await this.service.getUserHistory(userId);
    res.status(200).json({ history });
  });

  addStreamingToHistory = catchAsync(async (req: Request, res: Response) => {
    const { userId, 
      contentId, 
      title,
      contentType,
      episodeId,
      seasonNumber,
      episodeNumber,
      watchedDurationInMinutes,
      completionPercentage,
      rating } = req.body;
    
    logger.info({
      message: 'Adding streaming to history',
      userId,
      contentId,
      watchedDurationInMinutes,
      method: req.method,
      path: req.path,
    });

    const data = {
      contentId,
      contentType,
      title,
      watchedDurationInMinutes,
      episodeId,
      seasonNumber,
      episodeNumber,
      completionPercentage,
      rating,
    }
    const history = await this.service.addStreamingToHistory(userId, data);

    res.status(201).json({ message: 'Streaming entry added successfully', history });
  });

  removeStreamingFromHistory = catchAsync(async (req: Request, res: Response) => {
    const { userId, contentId } = req.query as { userId: string; contentId: string; };

    logger.info({
      message: 'Removing streaming from history',
      userId: userId,
      contentId: contentId,
      method: req.method,
      path: req.path,
    });

    const history = await this.service.removeStreamingFromHistory(userId, contentId);

    res.status(200).json({ message: 'Streaming entry removed successfully', history });
  });

  removeEpisodeFromHistory = catchAsync(async (req: Request, res: Response) => {
    const { userId, contentId, episodeId } = req.query as { userId: string; contentId: string; episodeId: string; };

    logger.info({
      message: 'Removing streaming from history',
      userId: userId,
      contentId: contentId,
      episodeId: episodeId,
      method: req.method,
      path: req.path,
    });

    const history = await this.service.removeEpisodeFromHistory(userId, contentId, episodeId);

    res.status(200).json({ message: 'Episode removed successfully', history });
  });

  calculateTotalWatchTime = catchAsync(async (req: Request, res: Response) => {
    const userId = req.validatedIds.userId;

    logger.info({
      message: 'Calculating total watch time',
      userId: userId,
      method: req.method,
      path: req.path,
    });

    const totalTime = await this.service.getTotalWatchTime(userId);
    res.status(200).json({ totalWatchTimeInMinutes: totalTime });
  });

  getByUserIdAndStreamingId = catchAsync(async (req: Request, res: Response) => {
    const { userId, contentId } = req.query as { userId: string; contentId: string; };
    logger.info({
      message: 'Fetching user streaming history by user and streaming ID',
      userId: userId,
      contentId: contentId,
      method: req.method, 
    });

    const viewed = await this.service.getByUserIdAndStreamingId(userId, contentId);
    res.status(200).json({ viewed });
  });

  addEpisodeToHistory = catchAsync(async (req: Request, res: Response) => {
    const { userId, contentId, episodeData } = req.body;

    logger.info({
      message: 'Adding episode to history',
      userId,
      contentId,
      episodeData,
      method: req.method,
      path: req.path,
    });

    const history = await this.service.addEpisodeToHistory(userId, contentId, episodeData);
    res.status(201).json({ message: 'Episode added to history successfully', history });
  }); 
  
  getEpisodesWatched = catchAsync(async (req: Request, res: Response) => {
    const { userId, contentId } = req.query as { userId: string; contentId: string; };

    logger.info({
      message: 'Fetching episodes watched by user',
      userId,
      contentId,
      method: req.method,
      path: req.path,
    });

    const seriesProgress = await this.service.getEpisodesWatched(userId, contentId);
    res.status(200).json(seriesProgress);
  });
}

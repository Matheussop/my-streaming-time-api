import { Request, Response } from 'express';
import { catchAsync } from '../util/catchAsync';
import logger from '../config/logger';
import { StreamingServiceError } from '../middleware/errorHandler';
import { UserStreamingHistoryService } from '../services/userStreamingHistoryService';

export class UserStreamingHistoryController {
  constructor(private service: UserStreamingHistoryService) {}

  getUserStreamingHistory = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId;
    logger.info({
      message: 'Fetching user streaming history',
      userId: userId,
      method: req.method,
      path: req.path,
    });

    validateIdFormat(userId, 'user');

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
      method: req.method,
      path: req.path,
    });

    if (!req.body || Object.keys(req.body).length === 0) {
      logger.warn({
        message: 'Request body is missing',
        method: req.method,
        path: req.path,
      });
      throw new StreamingServiceError('Request body is missing', 400);
    }

    validateIdFormat(userId, 'user');
    validateIdFormat(contentId, 'streaming');
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
    const { userId, contentId } = req.body;

    validateIdFormat(userId, 'user');
    validateIdFormat(contentId, 'contentId');

    const history = await this.service.removeStreamingFromHistory(userId, contentId);

    res.status(200).json({ message: 'Streaming entry removed successfully', history });
  });

  calculateTotalWatchTime = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId;

    logger.info({
      message: 'Calculating total watch time',
      userId: userId,
      method: req.method,
      path: req.path,
    });

    validateIdFormat(userId, 'user');

    const totalTime = await this.service.getTotalWatchTime(userId);
    res.status(200).json({ totalWatchTimeInMinutes: totalTime });
  });

  getByUserIdAndStreamingId = catchAsync(async (req: Request, res: Response) => {
    const { streamingId, userId } = req.query as { streamingId: string; userId: string };
    logger.info({
      message: 'Fetching user streaming history by user and streaming ID',
      userId: userId,
      streamingId: streamingId,
      method: req.method, 
    });

    validateIdFormat(userId, 'user');
    validateIdFormat(streamingId, 'streaming');

    const viewed = await this.service.getByUserIdAndStreamingId(userId, streamingId);
    res.status(200).json({ viewed });
  });
}

const validateIdFormat = (id: string, type: string) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new StreamingServiceError(`Invalid ${type} ID format`, 400);
  }
};

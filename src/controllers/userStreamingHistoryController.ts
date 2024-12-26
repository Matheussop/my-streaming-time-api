import { Request, Response } from 'express';
import { catchAsync } from '../util/catchAsync';
import logger from '../config/logger';
import { StreamingServiceError } from '../middleware/errorHandler';
import { IUserStreamingHistoryService } from '../interfaces/services';

export class UserStreamingHistoryController {
  constructor(private service: IUserStreamingHistoryService) {}

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
    const { userId, streamingId, title, durationInMinutes } = req.body;

    logger.info({
      message: 'Adding streaming to history',
      userId,
      streamingId,
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
    validateIdFormat(streamingId, 'streaming');

    const history = await this.service.addStreamingToHistory(userId, {
      streamingId,
      title,
      durationInMinutes,
    });

    res.status(201).json({ message: 'Streaming entry added successfully', history });
  });

  removeStreamingFromHistory = catchAsync(async (req: Request, res: Response) => {
    const { userId, streamingId } = req.body;

    validateIdFormat(userId, 'user');
    validateIdFormat(streamingId, 'streaming');

    const history = await this.service.removeStreamingFromHistory(userId, streamingId);

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
}

const validateIdFormat = (id: string, type: string) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new StreamingServiceError(`Invalid ${type} ID format`, 400);
  }
};

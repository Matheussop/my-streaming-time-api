import { Types } from 'mongoose';
import logger from '../config/logger';
import { IUserStreamingHistoryService } from '../interfaces/services';
import { IUserStreamingHistoryResponse, WatchHistoryEntry } from '../interfaces/userStreamingHistory';
import { StreamingServiceError } from '../middleware/errorHandler';
import { MovieRepository } from '../repositories/movieRepository';
import { SeriesRepository } from '../repositories/seriesRepository';
import { UserStreamingHistoryRepository } from '../repositories/userStreamingHistoryRepository';

export class UserStreamingHistoryService implements IUserStreamingHistoryService {
  constructor(
    private repository: UserStreamingHistoryRepository,
    private movieRepository: MovieRepository,
    private seriesRepository: SeriesRepository,
  ) {}

  async getUserHistory(userId: string | Types.ObjectId): Promise<IUserStreamingHistoryResponse> {
    const history = await this.repository.findByUserId(userId);
    if (!history) {
      logger.warn({
        message: 'User history not found',
        userId,
      });
      throw new StreamingServiceError('User history not found', 404);
    }
    return history;
  }

  async addStreamingToHistory(userId: string | Types.ObjectId, streamingData: WatchHistoryEntry): Promise<IUserStreamingHistoryResponse> {
    const streaming = await this.movieRepository.findById(streamingData.contentId) || await this.seriesRepository.findById(streamingData.contentId);
    if (!streaming) {
      logger.warn({
        message: 'Streaming not found',
        contentId: streamingData.contentId,
        userId,
      });
      throw new StreamingServiceError('Streaming not found', 404);
    }


    const history = await this.repository.findByUserId(userId);

    if (!history) {
      return this.repository.create({ 
        userId, 
        watchHistory: [streamingData],
        totalWatchTimeInMinutes: streamingData.watchedDurationInMinutes,
      });
    }

    const streamingInHistory = history.watchHistory.find((entry) => entry.contentId === streamingData.contentId);
    if (streamingInHistory) {
      throw new StreamingServiceError('Streaming already in history', 400);
    }

    return this.repository.addWatchHistoryEntry(userId, streamingData);
  }

  async removeStreamingFromHistory(userId: string | Types.ObjectId, contentId: string | Types.ObjectId): Promise<IUserStreamingHistoryResponse | null> {
    // TODO: Check if user exists

    const history = await this.getUserHistory(userId);

    const streaming = history.watchHistory.find((entry) => entry.contentId === contentId);
    if (!streaming) {
      logger.warn({
        message: 'Streaming not found in history',
        contentId,
        userId,
      });
      throw new StreamingServiceError('Streaming not found in history', 404);
    }

    const updatedHistory = await this.repository.removeWatchHistoryEntry(userId, contentId);
    
    if (!updatedHistory) {
      throw new StreamingServiceError('Failed to update history', 404);
    }
    return updatedHistory;
  }

  async getTotalWatchTime(userId: string | Types.ObjectId): Promise<number> {
    const history = await this.getUserHistory(userId);
    return history.totalWatchTimeInMinutes || 0;
  }

  async getByUserIdAndStreamingId(userId: string | Types.ObjectId, contentId: string | Types.ObjectId): Promise<boolean> {
    const history = await this.getUserHistory(userId);
    return history.watchHistory.some((entry) => entry.contentId === contentId);
  }
}

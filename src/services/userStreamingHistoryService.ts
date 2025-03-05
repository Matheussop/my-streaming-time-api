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

  async getUserHistory(userId: string): Promise<IUserStreamingHistoryResponse> {
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

  async addStreamingToHistory(userId: string, streamingData: WatchHistoryEntry): Promise<IUserStreamingHistoryResponse> {
    this.validateStreamingData(streamingData);

    const streaming = await this.movieRepository.findById(streamingData.contentId) || await this.seriesRepository.findById(streamingData.contentId);
    if (!streaming) {
      logger.warn({
        message: 'Streaming not found',
        contentId: streamingData.contentId,
        userId,
      });
      throw new StreamingServiceError('Streaming not found', 404);
    }

    if (streaming.title !== streamingData.title) {
      logger.warn({
        message: 'Streaming title mismatch',
        providedTitle: streamingData.title,
        actualTitle: streaming.title,
        contentId: streamingData.contentId,
      });
      throw new StreamingServiceError('Invalid streaming title', 400);
    }

    const history = await this.repository.findByUserId(userId);

    if (!history) {
      return this.repository.create({ userId, watchHistory: [streamingData] });
    }

    const streamingInHistory = history.watchHistory.find((entry) => entry.contentId === streamingData.contentId);
    if (streamingInHistory) {
      throw new StreamingServiceError('Streaming already in history', 400);
    }

    return this.repository.addWatchHistoryEntry(userId, streamingData);
  }

  async removeStreamingFromHistory(userId: string, contentId: string): Promise<IUserStreamingHistoryResponse | null> {
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

  async getTotalWatchTime(userId: string): Promise<number> {
    const history = await this.getUserHistory(userId);
    return history.totalWatchTimeInMinutes || 0;
  }

  async getByUserIdAndStreamingId(userId: string, contentId: string): Promise<boolean> {
    const history = await this.getUserHistory(userId);
    return history.watchHistory.some((entry) => entry.contentId === contentId);
  }

  // TODO: Verificar a necessidade de ficar no service ou no controller
  private validateStreamingData(data: WatchHistoryEntry): void {
    if (!data.contentId) {
      throw new StreamingServiceError('Streaming ID is required', 400);
    }
    if (!data.title) {
      throw new StreamingServiceError('Title is required', 400);
    }
    if (typeof data.watchedDurationInMinutes !== 'number' || data.watchedDurationInMinutes < 0) {
      throw new StreamingServiceError('Invalid duration', 400);
    }
  }
}

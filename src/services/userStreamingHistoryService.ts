import logger from '../config/logger';
import { IMovieRepository, IUserStreamingHistoryRepository } from '../interfaces/repositories';
import { IUserStreamingHistoryService } from '../interfaces/services';
import { StreamingServiceError } from '../middleware/errorHandler';
import { IUserStreamingHistory, StreamingHistoryEntry } from '../models/userStreamingHistoryModel';

export class UserStreamingHistoryService implements IUserStreamingHistoryService {
  constructor(
    private repository: IUserStreamingHistoryRepository,
    private movieRepository: IMovieRepository,
  ) {}

  async getUserHistory(userId: string): Promise<IUserStreamingHistory> {
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

  async addStreamingToHistory(userId: string, streamingData: StreamingHistoryEntry): Promise<IUserStreamingHistory> {
    this.validateStreamingData(streamingData);

    const streaming = await this.movieRepository.findById(streamingData.streamingId);
    if (!streaming) {
      logger.warn({
        message: 'Streaming not found',
        streamingId: streamingData.streamingId,
        userId,
      });
      throw new StreamingServiceError('Streaming not found', 404);
    }

    if (streaming.title !== streamingData.title) {
      logger.warn({
        message: 'Streaming title mismatch',
        providedTitle: streamingData.title,
        actualTitle: streaming.title,
        streamingId: streamingData.streamingId,
      });
      throw new StreamingServiceError('Invalid streaming title', 400);
    }

    const history = await this.repository.findByUserId(userId);

    if (!history) {
      return this.repository.create({ userId, watchHistory: [streamingData] });
    }

    const streamingInHistory = history.watchHistory.find((entry) => entry.streamingId === streamingData.streamingId);
    if (streamingInHistory) {
      throw new StreamingServiceError('Streaming already in history', 400);
    }

    return this.repository.addToHistory(userId, streamingData);
  }

  async removeStreamingFromHistory(userId: string, streamingId: string): Promise<IUserStreamingHistory | null> {
    // TODO: Check if user exists

    const history = await this.getUserHistory(userId);

    const streaming = history.watchHistory.find((entry) => entry.streamingId === streamingId);
    if (!streaming) {
      logger.warn({
        message: 'Streaming not found in history',
        streamingId,
        userId,
      });
      throw new StreamingServiceError('Streaming not found in history', 404);
    }
    const durationToSubtract = streaming.durationInMinutes || 0;

    const updatedHistory = await this.repository.removeFromHistory(userId, streamingId, durationToSubtract);
    if (!updatedHistory) {
      throw new StreamingServiceError('Failed to update history', 404);
    }
    return updatedHistory;
  }

  async getTotalWatchTime(userId: string): Promise<number> {
    const history = await this.getUserHistory(userId);
    return history.totalWatchTimeInMinutes;
  }

  // TODO: Verificar a necessidade de ficar no service ou no controller
  private validateStreamingData(data: StreamingHistoryEntry): void {
    if (!data.streamingId) {
      throw new StreamingServiceError('Streaming ID is required', 400);
    }
    if (!data.title) {
      throw new StreamingServiceError('Title is required', 400);
    }
    if (typeof data.durationInMinutes !== 'number' || data.durationInMinutes < 0) {
      throw new StreamingServiceError('Invalid duration', 400);
    }
  }
}

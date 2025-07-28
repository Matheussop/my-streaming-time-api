import { Types } from 'mongoose';
import logger from '../config/logger';
import { IUserStreamingHistoryService } from '../interfaces/services';
import { EpisodeWatched, IUserStreamingHistoryResponse, WatchHistoryEntry } from '../interfaces/userStreamingHistory';
import { StreamingServiceError } from '../middleware/errorHandler';
import { MovieRepository } from '../repositories/movieRepository';
import { SeriesRepository } from '../repositories/seriesRepository';
import { SeasonRepository } from '../repositories/seasonRepository';
import { UserStreamingHistoryRepository } from '../repositories/userStreamingHistoryRepository';
import { IMovieResponse } from '../interfaces/movie';
import { ISeriesResponse } from '../interfaces/series/series';
import { ErrorMessages } from '../constants/errorMessages';
import { Messages } from '../constants/messages';

export class UserStreamingHistoryService implements IUserStreamingHistoryService {
  constructor(
    private repository: UserStreamingHistoryRepository,
    private movieRepository: MovieRepository,
    private seriesRepository: SeriesRepository,
    private seasonRepository: SeasonRepository = new SeasonRepository(),
  ) {}

  async getUserHistory(userId: string | Types.ObjectId): Promise<IUserStreamingHistoryResponse> {
    const history = await this.repository.findByUserId(userId);
    if (!history) {
      throw new StreamingServiceError('User history not found', 404);
    }
    return history;
  }

  async addStreamingToHistory(userId: string | Types.ObjectId, streamingData: WatchHistoryEntry): Promise<IUserStreamingHistoryResponse> {
    await this.checkIfStreamingExistsAndValid(streamingData);

    const history = await this.repository.findByUserId(userId);

    if (history) {
      const streamingInHistory = history.watchHistory.find((entry) => entry.contentId.toString() === streamingData.contentId.toString());
      if (streamingInHistory) {
        throw new StreamingServiceError('Streaming already in history', 400);
      }
    }
    const newHistory = await this.repository.addWatchHistoryEntry(userId, streamingData);
    return newHistory;
  }

  async removeStreamingFromHistory(userId: string | Types.ObjectId, contentId: string | Types.ObjectId): Promise<IUserStreamingHistoryResponse | null> {
    // TODO: Check if user exists

    const history = await this.getUserHistory(userId);

    const streaming = history.watchHistory.find((entry) => entry.contentId.toString() === contentId.toString());
    if (!streaming) {
      throw new StreamingServiceError('Streaming not found in history', 404);
    }

    const updatedHistory = await this.repository.removeWatchHistoryEntry(userId, contentId);
    
    if (!updatedHistory) {
      throw new StreamingServiceError('Failed to update history', 404);
    }
    return updatedHistory;
  }

  async removeEpisodeFromHistory(userId: string | Types.ObjectId, contentId: string | Types.ObjectId, episodeId: string | Types.ObjectId): Promise<WatchHistoryEntry | null> {
    // TODO: Check if user exists

    const history = await this.getUserHistory(userId);

    const episodeWatched = history.watchHistory.find((entry) => {
      if(entry.contentId.toString() === contentId.toString()){
        const seriesProgress = entry.seriesProgress?.get(contentId.toString());
        if(seriesProgress){
          const episode = seriesProgress.episodesWatched.get(episodeId.toString());
          if(episode){
            return episode;
          }
        }
      }
    });
    if (!episodeWatched) {
      throw new StreamingServiceError('Episode not found in history', 404);
    }

    const updatedHistory = await this.repository.removeEpisodeFromHistory(userId, contentId, episodeId);
    
    if (!updatedHistory) {
      throw new StreamingServiceError('Failed to update history', 404);
    }
    return updatedHistory;
  }

  async addEpisodeToHistory(userId: string | Types.ObjectId, contentId: string | Types.ObjectId, episodeData: EpisodeWatched): Promise<WatchHistoryEntry | null> {

    const updatedHistory = await this.repository.updateEpisodeProgress(userId, contentId, episodeData);
    if (!updatedHistory) {
      logger.error({
        message: 'Erro ao adicionar episódio ao histórico',
        error: new Error('Failed to update history'),
        userId,
        contentId,
        episodeData
      });
      throw new StreamingServiceError('Failed to update history', 404);
    }
    logger.info({
      message: 'Episódio adicionado ao histórico',
      userId,
      contentId,
      episodeId: episodeData.episodeId
    });
    return updatedHistory;
  }

  async markSeasonAsWatched(userId: string | Types.ObjectId, contentId: string | Types.ObjectId, seasonNumber: number): Promise<WatchHistoryEntry | null> {
    const season = await this.seasonRepository.findEpisodesBySeasonNumber(contentId, seasonNumber);
    if (!season || !season.episodes) {
      throw new StreamingServiceError('Season not found', 404);
    }
    const seasonId = season._id.toString();
    const episodesWatches: EpisodeWatched[] = season.episodes.map(episode => {
      return { 
        episodeId: episode._id.toString(),
        seasonNumber: seasonNumber,
        episodeNumber: episode.episodeNumber,
        watchedDurationInMinutes: episode.durationInMinutes || 0,
        completionPercentage: 100,
        watchedAt: new Date(),
      }
    });
    const updatedHistory = await this.repository.updateSeasonProgress(userId, contentId, episodesWatches);
    if (!updatedHistory) {
      logger.error({
        message: ErrorMessages.HISTORY_SEASON_MARK_WATCHED,
        error: ErrorMessages.HISTORY_UPDATE_FAILED,
        userId,
        contentId,
        seasonId
      });
      throw new StreamingServiceError(ErrorMessages.HISTORY_UPDATE_FAILED, 404);
    }
    logger.info({
      message: Messages.HISTORY_STREAMING_MARKED_SUCCESSFULLY,
      userId,
      contentId,
      seasonId
    });
    return updatedHistory;
  }

  async getEpisodesWatched(userId: string | Types.ObjectId, contentId: string | Types.ObjectId): Promise<Map<string, EpisodeWatched> | null> {
    const history = await this.getUserHistory(userId);
    const seriesProgress = history.watchHistory.find((entry) => entry.contentId.toString() === contentId.toString())?.seriesProgress?.get(contentId.toString());
    return seriesProgress?.episodesWatched || null;
  }

  async getTotalWatchTime(userId: string | Types.ObjectId): Promise<number> {
    const history = await this.getUserHistory(userId);
    return history.totalWatchTimeInMinutes || 0;
  }

  async getByUserIdAndStreamingId(userId: string | Types.ObjectId, contentId: string | Types.ObjectId): Promise<boolean> {
    const history = await this.getUserHistory(userId);
    return history.watchHistory.some((entry) => entry.contentId.toString() === contentId.toString());
  }

  private async checkIfStreamingExistsAndValid(streamingData: WatchHistoryEntry): Promise<void> {
    const streaming = await this.getStreamingById(streamingData.contentId);
    this.validateStreamingData(streaming, streamingData);
  }
  
  private async getStreamingById(contentId: string | Types.ObjectId): Promise<IMovieResponse | ISeriesResponse> {
    const streaming = await this.movieRepository.findById(contentId) || 
                      await this.seriesRepository.findById(contentId);
    
    if (!streaming) {
      throw new StreamingServiceError('Streaming not found', 404);
    }
    
    return streaming;
  }

  private validateStreamingData(streaming: IMovieResponse | ISeriesResponse, streamingData: WatchHistoryEntry): void {
    if (streaming.title !== streamingData.title) {
      throw new StreamingServiceError('Streaming title does not match', 400);
    }
    
    if (streaming.contentType !== streamingData.contentType) {
      throw new StreamingServiceError('Content type does not match', 400);
    }
    
    // TODO: Validate the rest of history entry data
  }
}

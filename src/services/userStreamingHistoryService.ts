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
      throw new StreamingServiceError(ErrorMessages.HISTORY_USER_NOT_FOUND, 404);
    }
    return history;
  }

  async addStreamingToHistory(userId: string | Types.ObjectId, streamingData: WatchHistoryEntry): Promise<IUserStreamingHistoryResponse> {
    await this.checkIfStreamingExistsAndValid(streamingData);

    const history = await this.repository.findByUserId(userId);

    if (history) {
      const streamingInHistory = history.watchHistory.find((entry) => entry.contentId.toString() === streamingData.contentId.toString());
      if (streamingInHistory) {
        throw new StreamingServiceError(ErrorMessages.STREAMING_TYPE_ALREADY_EXISTS, 400);
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
      throw new StreamingServiceError(Messages.STREAMING_NOT_FOUND, 404);
    }

    const updatedHistory = await this.repository.removeWatchHistoryEntry(userId, contentId);
    
    if (!updatedHistory) {
      throw new StreamingServiceError(ErrorMessages.HISTORY_UPDATE_FAILED, 404);
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
      throw new StreamingServiceError(ErrorMessages.EPISODE_NOT_FOUND, 404);
    }

    const updatedHistory = await this.repository.removeEpisodeFromHistory(userId, contentId, episodeId);
    
    if (!updatedHistory) {
      throw new StreamingServiceError(ErrorMessages.HISTORY_UPDATE_FAILED, 404);
    }
    return updatedHistory;
  }

  async addEpisodeToHistory(userId: string | Types.ObjectId, contentId: string | Types.ObjectId, episodeData: EpisodeWatched): Promise<WatchHistoryEntry | null> {

    const updatedHistory = await this.repository.updateEpisodeProgress(userId, contentId, episodeData);
    if (!updatedHistory) {
      logger.error({
        message: ErrorMessages.HISTORY_UPDATE_FAILED,
        error: new Error(ErrorMessages.HISTORY_UPDATE_FAILED),
        userId,
        contentId,
        episodeData
      });
      throw new StreamingServiceError('Failed to update history', 404);
    }
    logger.info({
      message: Messages.STREAMING_ADDED_SUCCESSFULLY,
      userId,
      contentId,
      episodeId: episodeData.episodeId
    });
    return updatedHistory;
  }

  async markSeasonAsWatched(userId: string | Types.ObjectId, contentId: string | Types.ObjectId, seasonNumber: number): Promise<WatchHistoryEntry | null> {
    const season = await this.seasonRepository.findEpisodesBySeasonNumber(contentId, seasonNumber);
    if (!season || !season.episodes) {
      throw new StreamingServiceError(ErrorMessages.SEASON_NOT_FOUND, 404);
    }
    const seasonId = season._id.toString();
    
    // Filtrar apenas episódios que já foram lançados
    const releasedEpisodes = season.episodes.filter(episode => {
      return episode.releaseDate && new Date(episode.releaseDate) <= new Date();
    });
    
    const episodesWatches: EpisodeWatched[] = releasedEpisodes.map(episode => {
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

  async unMarkSeasonAsWatched(userId: string | Types.ObjectId, contentId: string | Types.ObjectId, seasonNumber: number): Promise<WatchHistoryEntry | null> {
    const updatedHistory = await this.repository.unMarkSeasonAsWatched(userId, contentId, seasonNumber);
    if (!updatedHistory) {
      logger.error({
        message: ErrorMessages.HISTORY_SEASON_UNMARK_WATCHED,
        error: ErrorMessages.HISTORY_UPDATE_FAILED,
        userId,
        contentId,
      });
      throw new StreamingServiceError(ErrorMessages.HISTORY_UPDATE_FAILED, 404);
    }
    logger.info({
      message: Messages.HISTORY_STREAMING_UNMARKED_SUCCESSFULLY,
      userId,
      contentId,
    });
    return updatedHistory
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
      throw new StreamingServiceError(Messages.STREAMING_NOT_FOUND, 404);
    }
    
    return streaming;
  }

  private validateStreamingData(streaming: IMovieResponse | ISeriesResponse, streamingData: WatchHistoryEntry): void {
    if (streaming.title !== streamingData.title) {
      throw new StreamingServiceError(ErrorMessages.STREAMING_TITLE_MISMATCH(streaming.title, streamingData.title), 400);
    }
    
    if (streaming.contentType !== streamingData.contentType) {
      const contentType = streaming.contentType || ""
      throw new StreamingServiceError(ErrorMessages.STREAMING_CONTENT_TYPE_MISMATCH(contentType, streamingData.contentType), 400);
    }
    
    // TODO: Validate the rest of history entry data
  }
}

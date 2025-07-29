import { Types } from 'mongoose';
import { IUserStreamingHistoryRepository } from '../interfaces/repositories';
import { EpisodeWatched, IUserStreamingHistoryResponse, WatchHistoryEntry } from '../interfaces/userStreamingHistory';
import UserStreamingHistory from '../models/userStreamingHistoryModel';

export class UserStreamingHistoryRepository implements IUserStreamingHistoryRepository {
  async findAll(skip: number, limit: number): Promise<IUserStreamingHistoryResponse[]> {
    return UserStreamingHistory.find().skip(skip).limit(limit);
  }

  async findById(id: string | Types.ObjectId): Promise<IUserStreamingHistoryResponse | null> {
    return UserStreamingHistory.findById(id);
  }

  async findByUserId(userId: string | Types.ObjectId): Promise<IUserStreamingHistoryResponse | null> {
    return UserStreamingHistory.findOne({ userId });
  }

  async create(data: Partial<IUserStreamingHistoryResponse>): Promise<IUserStreamingHistoryResponse> {
    return UserStreamingHistory.create(data);
  }

  async addWatchHistoryEntry(userId: string | Types.ObjectId, streamingData: WatchHistoryEntry): Promise<IUserStreamingHistoryResponse> {
    return UserStreamingHistory.addWatchHistoryEntry(userId, streamingData);
  }

  async getWatchHistory(userId: string | Types.ObjectId, skip: number, limit: number): Promise<IUserStreamingHistoryResponse[] | null> {
    return UserStreamingHistory.getWatchHistory(userId, skip, limit);
  }

  async hasWatched(userId: string | Types.ObjectId, contentId: string | Types.ObjectId, contentType: 'movie' | 'series'): Promise<boolean> {
    return UserStreamingHistory.hasWatched(userId, contentId, contentType);
  }

  async update(id: string | Types.ObjectId, data: Partial<IUserStreamingHistoryResponse>): Promise<IUserStreamingHistoryResponse | null> {
    return UserStreamingHistory.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async updateEpisodeProgress(userId: string | Types.ObjectId, contentId: string | Types.ObjectId, episodeData: EpisodeWatched): Promise<WatchHistoryEntry | null> {
    return UserStreamingHistory.updateEpisodeProgress(userId, contentId, episodeData);
  }

  async updateSeasonProgress(userId: string | Types.ObjectId, seasonId: string | Types.ObjectId, episodesWatches: EpisodeWatched[]): Promise<WatchHistoryEntry | null> {
    return UserStreamingHistory.updateSeasonProgress(userId,  seasonId, episodesWatches);
  }

  async unMarkSeasonAsWatched(userId: string | Types.ObjectId, seasonId: string | Types.ObjectId, seasonNumber: number): Promise<WatchHistoryEntry | null> {
    return UserStreamingHistory.unMarkSeasonAsWatched(userId,  seasonId, seasonNumber);
  }

  async delete(id: string | Types.ObjectId): Promise<IUserStreamingHistoryResponse | null> {
    return UserStreamingHistory.findByIdAndDelete(id);
  }

  async removeWatchHistoryEntry(
    userId: string | Types.ObjectId,
    contentId: string | Types.ObjectId,
  ): Promise<IUserStreamingHistoryResponse | null> {
    return UserStreamingHistory.removeWatchHistoryEntry(userId, contentId);
  }

  async removeEpisodeFromHistory(
    userId: string | Types.ObjectId,
    contentId: string | Types.ObjectId,
    episodeId: string | Types.ObjectId,
  ): Promise<WatchHistoryEntry | null> {
    return UserStreamingHistory.removeEpisodeFromHistory(userId, contentId, episodeId);
  }
}

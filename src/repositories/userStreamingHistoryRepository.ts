import { Types } from 'mongoose';
import { IUserStreamingHistoryRepository } from '../interfaces/repositories';
import { IUserStreamingHistoryResponse, WatchHistoryEntry } from '../interfaces/userStreamingHistory';
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

  async hasWatched(userId: string | Types.ObjectId, contentId: string | Types.ObjectId): Promise<boolean> {
    return UserStreamingHistory.hasWatched(userId, contentId);
  }

  async getWatchProgress(userId: string | Types.ObjectId, contentId: string | Types.ObjectId): Promise<number> {
    return UserStreamingHistory.getWatchProgress(userId, contentId);
  }

  async update(id: string | Types.ObjectId, data: Partial<IUserStreamingHistoryResponse>): Promise<IUserStreamingHistoryResponse | null> {
    return UserStreamingHistory.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
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
}

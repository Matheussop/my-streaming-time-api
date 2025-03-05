import { IUserStreamingHistoryRepository } from '../interfaces/repositories';
import { IUserStreamingHistoryResponse, WatchHistoryEntry } from '../interfaces/userStreamingHistory';
import UserStreamingHistory from '../models/userStreamingHistoryModel';

export class UserStreamingHistoryRepository implements IUserStreamingHistoryRepository {
  async findAll(skip: number, limit: number): Promise<IUserStreamingHistoryResponse[]> {
    return UserStreamingHistory.find().skip(skip).limit(limit);
  }

  async findById(id: string): Promise<IUserStreamingHistoryResponse | null> {
    return UserStreamingHistory.findById(id);
  }

  async findByUserId(userId: string): Promise<IUserStreamingHistoryResponse | null> {
    return UserStreamingHistory.findOne({ userId });
  }

  async create(data: Partial<IUserStreamingHistoryResponse>): Promise<IUserStreamingHistoryResponse> {
    const history = new UserStreamingHistory(data);
    return history.save();
  }

  async addWatchHistoryEntry(userId: string, streamingData: WatchHistoryEntry): Promise<IUserStreamingHistoryResponse> {
    let history = await this.findByUserId(userId);

    if (!history) {
      history = await this.create({
        userId,
        watchHistory: [],
        totalWatchTimeInMinutes: 0,
      });
    }

    history.watchHistory.push(streamingData);
    return UserStreamingHistory.addWatchHistoryEntry(userId, streamingData);
  }

  async getWatchHistory(userId: string, skip: number, limit: number): Promise<IUserStreamingHistoryResponse[] | null> {
    return UserStreamingHistory.getWatchHistory(userId, skip, limit);
  }

  async hasWatched(userId: string, contentId: string): Promise<boolean> {
    return UserStreamingHistory.hasWatched(userId, contentId);
  }

  async getWatchProgress(userId: string, contentId: string): Promise<number> {
    return UserStreamingHistory.getWatchProgress(userId, contentId);
  }

  async update(id: string, data: Partial<IUserStreamingHistoryResponse>): Promise<IUserStreamingHistoryResponse | null> {
    return UserStreamingHistory.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<IUserStreamingHistoryResponse | null> {
    return UserStreamingHistory.findByIdAndDelete(id);
  }

  async removeWatchHistoryEntry(
    userId: string,
    contentId: string,
  ): Promise<IUserStreamingHistoryResponse | null> {
    return UserStreamingHistory.removeWatchHistoryEntry(userId, contentId);
  }
}

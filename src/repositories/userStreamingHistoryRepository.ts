import { IUserStreamingHistoryRepository } from '../interfaces/repositories';
import UserStreamingHistory, {
  IUserStreamingHistory,
  StreamingHistoryEntry,
} from '../models/userStreamingHistoryModel';

export class UserStreamingHistoryRepository implements IUserStreamingHistoryRepository {
  async findAll(skip:number, limit: number): Promise<IUserStreamingHistory[]> {
    return UserStreamingHistory.find().skip(skip).limit(limit);
  }

  async findById(id: string): Promise<IUserStreamingHistory | null> {
    return UserStreamingHistory.findById(id);
  }

  async findByUserId(userId: string): Promise<IUserStreamingHistory | null> {
    return UserStreamingHistory.findOne({ userId });
  }

  async create(data: Partial<IUserStreamingHistory>): Promise<IUserStreamingHistory> {
    const history = new UserStreamingHistory(data);
    return history.save();
  }

  async addToHistory(userId: string, streamingData: StreamingHistoryEntry): Promise<IUserStreamingHistory> {
    let history = await this.findByUserId(userId);

    if (!history) {
      history = await this.create({
        userId,
        watchHistory: [],
        totalWatchTimeInMinutes: 0,
      });
    }

    history.watchHistory.push(streamingData);
    return history.save();
  }

  async update(id: string, data: Partial<IUserStreamingHistory>): Promise<IUserStreamingHistory | null> {
    return UserStreamingHistory.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<IUserStreamingHistory | null> {
    return UserStreamingHistory.findByIdAndDelete(id);
  }

  async removeFromHistory(
    userId: string,
    streamingId: string,
    durationToSubtract: number,
  ): Promise<IUserStreamingHistory | null> {
    return UserStreamingHistory.findOneAndUpdate(
      { userId },
      { $pull: { watchHistory: { streamingId } }, $inc: { totalWatchTimeInMinutes: -durationToSubtract } },
      { new: true },
    );
  }
}

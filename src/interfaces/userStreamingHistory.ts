import { Document, Model, Types } from "mongoose";

export interface WatchHistoryEntry {
  contentId: string | Types.ObjectId;           // Reference to content (movie/series)
  contentType: 'movie' | 'series';
  title: string;               // Denormalized for performance
  episodeId?: string | Types.ObjectId;          // Only for series
  seasonNumber?: number;       // Only for series
  episodeNumber?: number;      // Only for series
  watchedAt?: Date;             // When it was watched
  watchedDurationInMinutes: number;
  completionPercentage?: number; // 0-100%
  rating?: number;             // User rating
}

export interface IUserStreamingHistoryCreate {
  userId: string | Types.ObjectId;
  watchHistory: WatchHistoryEntry[];
  totalWatchTimeInMinutes?: number;
}

export interface IUserStreamingHistoryUpdate {
  userId?: string | Types.ObjectId;
  watchHistory?: WatchHistoryEntry[];
  totalWatchTimeInMinutes?: number;
}

export interface IUserStreamingHistoryResponse extends IUserStreamingHistoryCreate {
  _id: string | Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserStreamingHistoryDocument = IUserStreamingHistoryResponse & Document;

export interface IUserStreamingHistoryModel extends Model<IUserStreamingHistoryDocument> {
  findByUserId(userId: string | Types.ObjectId): Promise<IUserStreamingHistoryResponse | null>;
  addWatchHistoryEntry(userId: string | Types.ObjectId, entry: Omit<WatchHistoryEntry, 'watchedAt'> & { watchedAt?: Date }): Promise<IUserStreamingHistoryResponse>;
  removeWatchHistoryEntry(userId: string | Types.ObjectId, contentId: string | Types.ObjectId): Promise<IUserStreamingHistoryResponse | null>;
  getWatchHistory(userId: string | Types.ObjectId, skip: number, limit: number): Promise<IUserStreamingHistoryResponse[] | null>;
  hasWatched(userId: string | Types.ObjectId, contentId: string | Types.ObjectId): Promise<boolean>;
  getWatchProgress(userId: string | Types.ObjectId, contentId: string | Types.ObjectId): Promise<number>;
}

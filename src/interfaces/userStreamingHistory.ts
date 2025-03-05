import { Document, Model } from "mongoose";

export interface WatchHistoryEntry {
  contentId: string;           // Reference to content (movie/series)
  contentType: 'movie' | 'series';
  title: string;               // Denormalized for performance
  episodeId?: string;          // Only for series
  seasonNumber?: number;       // Only for series
  episodeNumber?: number;      // Only for series
  watchedAt?: Date;             // When it was watched
  watchedDurationInMinutes: number;
  completionPercentage?: number; // 0-100%
  rating?: number;             // User rating
}

export interface IUserStreamingHistoryCreate {
  userId: string;
  watchHistory: WatchHistoryEntry[];
  totalWatchTimeInMinutes?: number;
}

export interface IUserStreamingHistoryUpdate {
  userId?: string;
  watchHistory?: WatchHistoryEntry[];
  totalWatchTimeInMinutes?: number;
}

export interface IUserStreamingHistoryResponse extends IUserStreamingHistoryCreate {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserStreamingHistoryDocument = IUserStreamingHistoryResponse & Document;

export interface IUserStreamingHistoryModel extends Model<IUserStreamingHistoryDocument> {
  findByUserId(userId: string): Promise<IUserStreamingHistoryResponse | null>;
  addWatchHistoryEntry(userId: string, entry: Omit<WatchHistoryEntry, 'watchedAt'> & { watchedAt?: Date }): Promise<IUserStreamingHistoryResponse>;
  removeWatchHistoryEntry(userId: string, contentId: string): Promise<IUserStreamingHistoryResponse | null>;
  getWatchHistory(userId: string, skip: number, limit: number): Promise<IUserStreamingHistoryResponse[] | null>;
  hasWatched(userId: string, contentId: string): Promise<boolean>;
  getWatchProgress(userId: string, contentId: string): Promise<number>;
}

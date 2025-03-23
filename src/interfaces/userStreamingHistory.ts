import { Document, Model, Types } from "mongoose";

export interface EpisodeWatched {
  episodeId: string;
  seasonNumber: number;
  episodeNumber: number;
  watchedAt: Date;
  watchedDurationInMinutes: number;
  completionPercentage: number;
}
export interface SeriesProgress {
  totalEpisodes: number;
  watchedEpisodes: number;
  lastWatched?: {
    seasonNumber: number;
    episodeNumber: number;
    episodeId: string;
    completionPercentage: number;
    watchedAt: Date;
  };
  episodesWatched: EpisodeWatched[];
  nextToWatch?: {
    seasonNumber: number;
    episodeNumber: number;
    episodeId: string;
  };
  completed: boolean;
}
export interface WatchHistoryEntry {
  contentId: string | Types.ObjectId;           // Reference to content (movie/series)
  contentType: 'movie' | 'series';
  title: string;               // Denormalized for performance
  seriesProgress?: Map<string, SeriesProgress>;
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
  getWatchedEpisodesForSeries(userId: string | Types.ObjectId, contentId: string | Types.ObjectId): Promise<EpisodeWatched[]>;
  calculateNextEpisode(userId: string | Types.ObjectId, contentId: string | Types.ObjectId, seasonNumber: number): Promise<number>;
  updateEpisodeProgress(userId: string | Types.ObjectId, contentId: string | Types.ObjectId, episodeDate: EpisodeWatched): Promise<IUserStreamingHistoryResponse | null>;
}

interface WatchHistoryEntry {
  contentId: string;           // Reference to content (movie/series)
  contentType: 'movie' | 'series';
  title: string;               // Denormalized for performance
  episodeId?: string;          // Only for series
  seasonNumber?: number;       // Only for series
  episodeNumber?: number;      // Only for series
  watchedAt: Date;             // When it was watched
  watchedDurationInMinutes: number;
  completionPercentage: number; // 0-100%
  rating?: number;             // User rating
}

export interface IUserStreamingHistoryCreate {
  userId: string;
  watchHistory: WatchHistoryEntry[];
  totalWatchTimeInMinutes: number;
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

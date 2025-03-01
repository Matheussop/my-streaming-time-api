import { Types } from "mongoose";

interface IUserPreferences {
  favoriteActors: string[];
  favoriteGenres: Types.ObjectId[];
  contentMaturity?: ['G', 'PG', 'PG-13', 'R', 'NC-17', 'All'];
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  theme?: 'light' | 'dark' | 'system';
  language: string;
}

interface IUserStats {
  seriesCompleted: number;
  lastActive: Date;
  joinDate: Date;
  favoriteStreamingType: Types.ObjectId;
  episodesWatched: number;
  moviesWatched: number;
  totalWatchTimeInMinutes: number;
}

export interface IUserCreate {
  username: string;
  email: string;
  password: string;
  active: boolean;
  profilePicture?: string;
  preferences?: IUserPreferences;
  watchList?: Types.ObjectId[];
  stats?: IUserStats;
  role?: 'user' | 'admin' | 'moderator';
}

export interface IUserUpdate {
  username?: string;
  email?: string;
  password?: string;
  profilePicture?: string;
  preferences?: IUserPreferences;
  watchList?: Types.ObjectId[];
  stats?: IUserStats;
  role?: 'user' | 'admin' | 'moderator';
}

export interface IUserResponse extends IUserCreate { 
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
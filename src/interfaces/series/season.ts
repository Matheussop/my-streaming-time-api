import { Model, Types, Document } from "mongoose";

export interface IEpisode {
  _id: string | Types.ObjectId;
  episodeNumber: number;
  title: string;
  plot: string;
  durationInMinutes: number;
  releaseDate: string;
  poster: string;
}

export type SeasonStatus = 'COMPLETED' | 'ONGOING' | 'UPCOMING' | 'SPECIAL_INTEREST';

export interface ISeasonCreate {
  seriesId: Types.ObjectId | string;
  seasonNumber: number;
  tmdbId: number;
  title: string;
  plot: string;
  releaseDate: string;
  poster?: string;
  episodes?: IEpisode[];
  episodeCount?: number;
  status?: SeasonStatus;
  lastUpdated?: Date;
  nextEpisodeDate?: Date;
  releaseWeekday?: number;
  accessCount?: number;
  lastAccessed?: Date;
}

export interface ISeasonUpdate {
  seriesId?: Types.ObjectId | string;
  seasonNumber?: number;
  tmdbId?: number;
  title?: string;
  plot?: string;
  releaseDate?: string;
  poster?: string;
  episodes?: IEpisode[];
  episodeCount?: number;
  status?: SeasonStatus;
  lastUpdated?: Date;
  nextEpisodeDate?: Date;
  releaseWeekday?: number;
  accessCount?: number;
  lastAccessed?: Date;
}

export interface ISeasonResponse extends ISeasonCreate {
  _id: string | Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ISeasonDocument = Document & ISeasonResponse;

export interface ISeasonModel extends Model<ISeasonDocument> {
  findBySeriesId(seriesId: string | Types.ObjectId, skip: number, limit: number): Promise<ISeasonResponse[] | null>;
  findEpisodesBySeasonNumber(seriesId: string | Types.ObjectId, seasonNumber: number): Promise<ISeasonResponse | null>;
  findByStatus(statuses: SeasonStatus[]): Promise<ISeasonResponse[]>;
  findPopularSeasons(threshold?: number): Promise<ISeasonResponse[]>;
}

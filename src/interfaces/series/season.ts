import { Model, Types } from "mongoose";

export interface IEpisode {
  _id: string;
  episodeNumber: number;
  title: string;
  plot: string;
  durationInMinutes: number;
  releaseDate: string;
  poster: string;
}

export interface ISeasonCreate {
  seriesId: Types.ObjectId;
  seasonNumber: number;
  title: string;
  plot: string;
  releaseDate: string;
  poster?: string;
  episodes?: IEpisode[];
}

export interface ISeasonUpdate {
  seriesId?: Types.ObjectId;
  seasonNumber?: number;
  title?: string;
  plot?: string;
  releaseDate?: string;
  poster?: string;
  episodes?: IEpisode[];
}

export interface ISeasonResponse extends ISeasonCreate {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ISeasonDocument = Document & ISeasonResponse;

export interface ISeasonModel extends Model<ISeasonDocument> {
  findBySeriesId(seriesId: string, skip: number, limit: number): Promise<ISeasonResponse[] | null>;
}

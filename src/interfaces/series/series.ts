import { Types } from "mongoose";

interface ISeasonSummary {
  seasonNumber: number;
  title: string;
  episodeCount: number;
  releaseDate: string;
}

interface IGenreReference {
  _id: Types.ObjectId;
  id: number;
  name: string;
}

export interface ISeriesCreate {
  title: string;
  release_date: string;
  plot: string;
  cast?: string[];
  rating: number;
  genre: number[] | IGenreReference;
  status?: string;
  tmdbId?: number;
  totalEpisodes: number;
  totalSeasons: number;
  seasonsSummary?: ISeasonSummary[];
  poster: string;
  url: string;
}

export interface ISeriesUpdate {
  title?: string;
  release_date?: string;
  plot?: string;
  cast?: string[];
  rating?: number;
  genre?: IGenreReference[];
  status?: string;
  tmdbId?: number;
  totalEpisodes?: number;
  totalSeasons?: number;
  seasonsSummary?: ISeasonSummary[];
  poster?: string;
  url?: string;
}

export interface ISeriesResponse extends Omit<ISeriesCreate, "genre"> {
  _id: string;
  genre: IGenreReference[];
  createdAt: Date;
  updatedAt: Date;
}

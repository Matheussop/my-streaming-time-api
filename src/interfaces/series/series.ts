import { Types } from "mongoose";
import { IContentCreate, IContentDocument, IContentModel, IContentResponse, IContentUpdate } from "../content";

export interface ISeasonSummary {
  seasonId: Types.ObjectId | string;
  seasonNumber: number;
  title: string;
  episodeCount: number;
  releaseDate: string;
}

export interface ISeriesCreate extends IContentCreate {
  totalEpisodes: number;
  totalSeasons: number;
  seasonsSummary?: ISeasonSummary[];
}

export interface ISeriesUpdate extends IContentUpdate{
  totalEpisodes?: number;
  totalSeasons?: number;
  seasonsSummary?: ISeasonSummary[];
}

export interface ISeriesResponse extends Omit<ISeriesCreate, "genre">, IContentResponse {}

export interface ISeriesDocument extends IContentDocument, ISeriesResponse {}

export interface ISeriesModel extends IContentModel {}


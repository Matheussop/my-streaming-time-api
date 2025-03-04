import { Model } from "mongoose";
import { IContentCreate, IContentDocument, IContentModel, IContentResponse, IContentUpdate } from "./content";

export interface IMovieCreate extends IContentCreate {
  durationTime: number;
}

export interface IMovieUpdate extends IContentUpdate {
  durationTime?: number;
}

export interface IMovieResponse extends Omit<IMovieCreate, "genre">, IContentResponse {}

export interface IMovieDocument extends IContentDocument, IMovieResponse {}

export interface IMovieModel extends IContentModel {}

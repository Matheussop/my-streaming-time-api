import { Document, Model, Types } from "mongoose";

interface IGenreReference {
  _id: Types.ObjectId;
  id: number;
  name: string;
}

export interface IContentCreate {
  title: string;
  releaseDate: string;
  plot?: string;
  cast?: string[];
  rating?: number;
  genre: number[] | IGenreReference;
  status?: string;
  tmdbId?: number;
  poster?: string;
  url?: string;
  contentType: string;
}

export interface IContentUpdate {
  title?: string;
  releaseDate?: string;
  plot?: string;
  cast?: string[];
  rating?: number;
  genre?: IGenreReference[];
  status?: string;
  tmdbId?: number;
  poster?: string;
  url?: string;
  contentType?: string;
}

export interface IContentResponse extends Omit<IContentCreate, "genre"> {
  _id: Types.ObjectId;
  genre: IGenreReference[];
  createdAt: Date;
  updatedAt: Date;
}


export type IContentDocument = Document & IContentResponse;

export interface IContentModel extends Model<IContentDocument> {
  findByTitle(title: string, skip: number, limit: number): Promise<IContentResponse[] | null>;
  findByGenre(genre: string, skip: number, limit: number): Promise<IContentResponse[] | null>;
}


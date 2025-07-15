import { Document, Model, Types } from "mongoose";

export interface IGenreReference {
  _id: Types.ObjectId | string;
  id: number;
  name: string;
  poster: string;
}
export interface IStreamingTypeCreate {
  name: string;
  supportedGenres?: IGenreReference[];
  description?: string;
  isActive?: boolean;
}

export interface IStreamingTypeUpdate {
  name?: string;
  supportedGenres?: IGenreReference[];
  description?: string;
  isActive?: string;
}

export interface IStreamingTypeResponse extends IStreamingTypeCreate {
  _id: string | Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

export type IStreamingTypeDocument = IStreamingTypeResponse & Document;
export interface IStreamingTypeModel extends Model<IStreamingTypeDocument> {
  findByName(name: string): Promise<IStreamingTypeResponse | null>;
  findByGenreName(genreName: string, id: string | Types.ObjectId): Promise<IStreamingTypeResponse | null>;
  deleteByGenresName(genresName: string[], id: string | Types.ObjectId): Promise<IStreamingTypeResponse | null>;
}
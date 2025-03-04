import { Document, Model, Types } from "mongoose";

export interface IGenreReference {
  _id: Types.ObjectId;
  id: number;
  name: string;
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
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IStreamingTypeDocument = IStreamingTypeResponse & Document;
export interface IStreamingTypeModel extends Model<IStreamingTypeDocument> {
  findByName(name: string): Promise<IStreamingTypeResponse | null>;
  findByGenreName(genreName: string, id: string): Promise<IStreamingTypeResponse | null>;
}
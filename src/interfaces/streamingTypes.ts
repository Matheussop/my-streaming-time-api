import { Types } from "mongoose";
export interface IStreamingTypeCreate {
  name: string;
  supportedGenres: Types.ObjectId[];
  description: string;
  isActive: boolean;
}

export interface IStreamingTypeUpdate {
  name?: string;
  supportedGenres?: Types.ObjectId[];
  description?: string;
  isActive?: string;
}

export interface IStreamingTypeResponse extends IStreamingTypeCreate {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

import { Types } from "mongoose";

export interface IGenreCreate {
  id: number;
  name: string;        
  poster?: string; 
}

export interface IGenreUpdate {
  id?: number;
  name? : string;
  poster?: string;
}

export interface IGenreResponse extends IGenreCreate{
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

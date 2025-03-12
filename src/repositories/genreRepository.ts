import { IGenreCreate, IGenreResponse, IGenreUpdate } from "../interfaces/genres";
import { IGenreRepository } from "../interfaces/repositories";
import Genre from "../models/genresModel"
import { Types } from "mongoose";

export class GenreRepository implements IGenreRepository{
  async findByName(name: string): Promise<IGenreResponse | null> {
    return Genre.findByName(name);
  };

  async findAll(skip: number, limit: number): Promise<IGenreResponse[]>{
    return Genre.find().skip(skip).limit(limit);
  };

  async findById(id: string | Types.ObjectId): Promise<IGenreResponse | null>{
    return Genre.findById(id);
  };

  async create(data: Partial<IGenreCreate> | Partial<IGenreCreate>[]): Promise<IGenreResponse | IGenreResponse[]>{
    return Genre.create(data);
  };

  async update(id: string | Types.ObjectId, data: Partial<IGenreUpdate>): Promise<IGenreResponse | null>{
    return Genre.findOneAndUpdate({ _id: id }, { $set: data }, { new: true, runValidators: true });
  };

  async delete(id: string | Types.ObjectId): Promise<IGenreResponse | null>{
    return Genre.findByIdAndDelete(id)
  };
}
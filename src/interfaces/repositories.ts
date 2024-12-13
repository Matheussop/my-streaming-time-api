import { IUser } from '../models/userModel';
import { IMovie } from '../models/movieModel';
import { IStreamingType } from '../models/streamingTypesModel';

export interface IBaseRepository<T> {
  findAll(skip?: number, limit?: number): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<T | null>;
}

export interface IMovieRepository extends IBaseRepository<IMovie> {
  findByTitle(title: string, skip?: number, limit?: number): Promise<IMovie[] | null>;
}

export interface IUserRepository extends IBaseRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

export interface IStreamingTypeRepository extends IBaseRepository<IStreamingType> {} 
import { ISeriesCreate, ISeriesResponse, ISeriesUpdate } from './series';
import { IUser } from '../models/userModel';
import { IMovie } from '../models/movieModel';
import { IUserStreamingHistory, StreamingHistoryEntry } from '../models/userStreamingHistoryModel';
import { ICategory, IStreamingTypeResponse } from './streamingTypes';

export interface IBaseRepository<T, TCreate = T, TUpdate = T> {
  findAll(skip: number, limit: number): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: Partial<TCreate>): Promise<TCreate>;
  update(id: string, data: Partial<TUpdate>): Promise<TUpdate | null>;
  delete(id: string): Promise<T | null>;
}

export interface IMovieRepository extends IBaseRepository<IMovie> {
  findByGenre(genre_id: number, skip: number, limit: number): Promise<IMovie[] | null>;
  findByTitle(title: string, skip?: number, limit?: number): Promise<IMovie[] | null>;
}

export interface IUserRepository extends IBaseRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

export interface IUserStreamingHistoryRepository extends IBaseRepository<IUserStreamingHistory> {
  findByUserId(userId: string): Promise<IUserStreamingHistory | null>;
  addToHistory(userId: string, streamingData: StreamingHistoryEntry): Promise<IUserStreamingHistory>;
  removeFromHistory(
    userId: string,
    streamingId: string,
    durationToSubtract: number,
  ): Promise<IUserStreamingHistory | null>;
}

export interface IStreamingTypeRepository extends IBaseRepository<IStreamingTypeResponse> {
  findByName(name: string): Promise<IStreamingTypeResponse | null>;
  getIdGenreByName(genre: string): Promise<number | null>;
  addCategory(id: string, category: ICategory[]): Promise<IStreamingTypeResponse | null>;
  removeCategory(id: string, categoryId: Partial<ICategory>[]): Promise<IStreamingTypeResponse | null>;
}

export interface ISeriesRepository extends IBaseRepository<ISeriesResponse, ISeriesCreate, ISeriesUpdate>{
  findByTitle(title: string, skip?: number, limit?: number): Promise<ISeriesResponse[] | null>;
  findByGenre(genre_id: number, skip: number, limit: number): Promise<ISeriesResponse[] | null>;
}

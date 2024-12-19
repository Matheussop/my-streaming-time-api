import { IUser } from '../models/userModel';
import { IMovie } from '../models/movieModel';
import { IUserStreamingHistory, StreamingHistoryEntry } from '../models/userStreamingHistoryModel';
import { ICategory, IStreamingTypeResponse } from './streamingTypes';

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
  addCategory(id: string, category: ICategory[]): Promise<IStreamingTypeResponse | null>;
  removeCategory(id: string, categoryId: Partial<ICategory>[]): Promise<IStreamingTypeResponse | null>;
}

import { ISeriesCreate, ISeriesResponse, ISeriesUpdate } from './series/series';
import { IStreamingTypeCreate, IStreamingTypeResponse, IStreamingTypeUpdate } from './streamingTypes';
import { IUserResponse } from './user';
import { IUserStreamingHistoryResponse, WatchHistoryEntry } from './userStreamingHistory';
import { IGenreCreate, IGenreResponse, IGenreUpdate } from './genres';
import { IMovieResponse } from './movie';
import { IContentResponse } from './content';

export interface IBaseRepository<T, TCreate = T, TUpdate = T> {
  findAll(skip: number, limit: number): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: Partial<TCreate> | Partial<TCreate>[]): Promise<T | T[]>;
  update(id: string, data: Partial<TUpdate>): Promise<T | null>;
  delete(id: string): Promise<T | null>;
}

export interface IContentRepository extends IBaseRepository<IContentResponse> {
  findByGenre(genre: string, skip: number, limit: number): Promise<IContentResponse[] | null>;
  findByTitle(title: string, skip: number, limit: number): Promise<IContentResponse[] | null>;
}

export interface IMovieRepository extends IBaseRepository<IMovieResponse> {
  findByTitle(title: string, skip: number, limit: number): Promise<IMovieResponse[] | null>;
  findByGenre(genre: string, skip: number, limit: number): Promise<IMovieResponse[] | null>;
}

export interface IUserRepository extends IBaseRepository<IUserResponse> {
  findByEmail(email: string): Promise<IUserResponse | null>;
}

export interface IUserStreamingHistoryRepository extends IBaseRepository<IUserStreamingHistoryResponse> {
  findByUserId(userId: string): Promise<IUserStreamingHistoryResponse | null>;
  addToHistory(userId: string, streamingData: WatchHistoryEntry): Promise<IUserStreamingHistoryResponse>;
  removeFromHistory(
    userId: string,
    streamingId: string,
    durationToSubtract: number,
  ): Promise<IUserStreamingHistoryResponse | null>;
}

export interface IStreamingTypeRepository extends IBaseRepository<IStreamingTypeResponse, IStreamingTypeCreate, IStreamingTypeUpdate> {
  findByName(name: string): Promise<IStreamingTypeResponse | null>;
}

export interface ISeriesRepository extends IBaseRepository<ISeriesResponse, ISeriesCreate, ISeriesUpdate>{
  findByTitle(title: string, skip?: number, limit?: number): Promise<ISeriesResponse[] | null>;
  findByGenre(genre: string, skip: number, limit: number): Promise<ISeriesResponse[] | null>;
}

export interface IGenreRepository extends IBaseRepository<IGenreResponse, IGenreCreate, IGenreUpdate>{
  findByName(name: string): Promise<IGenreResponse | null>; 
}
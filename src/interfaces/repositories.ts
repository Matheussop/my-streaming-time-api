import { ISeriesCreate, ISeriesResponse, ISeriesUpdate } from './series/series';
import { IGenreReference, IStreamingTypeCreate, IStreamingTypeResponse, IStreamingTypeUpdate } from './streamingTypes';
import { IUserResponse } from './user';
import { IUserStreamingHistoryResponse, WatchHistoryEntry } from './userStreamingHistory';
import { IGenreCreate, IGenreResponse, IGenreUpdate } from './genres';
import { IMovieResponse } from './movie';
import { IContentResponse } from './content';
import { ISeasonCreate, ISeasonUpdate } from './series/season';
import { ISeasonResponse } from './series/season';
import { Types } from 'mongoose';
export interface IBaseRepository<T, TCreate = T, TUpdate = T> {
  findAll(skip: number, limit: number): Promise<T[]>;
  findById(id: string | Types.ObjectId): Promise<T | null>;
  create(data: Partial<TCreate> | Partial<TCreate>[]): Promise<T | T[]>;
  update(id: string | Types.ObjectId, data: Partial<TUpdate>): Promise<T | null>;
  delete(id: string | Types.ObjectId): Promise<T | null>;
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
  findByUserId(userId: string | Types.ObjectId): Promise<IUserStreamingHistoryResponse | null>;
  addWatchHistoryEntry(userId: string | Types.ObjectId, streamingData: WatchHistoryEntry): Promise<IUserStreamingHistoryResponse>;
  getWatchHistory(userId: string | Types.ObjectId, skip: number, limit: number): Promise<IUserStreamingHistoryResponse[] | null>;
  hasWatched(userId: string | Types.ObjectId, contentId: string | Types.ObjectId): Promise<boolean>;
  getWatchProgress(userId: string | Types.ObjectId, contentId: string | Types.ObjectId): Promise<number>;
  removeWatchHistoryEntry(
    userId: string | Types.ObjectId,
    contentId: string | Types.ObjectId,
  ): Promise<IUserStreamingHistoryResponse | null>;
}

export interface IStreamingTypeRepository extends IBaseRepository<IStreamingTypeResponse, IStreamingTypeCreate, IStreamingTypeUpdate> {
  findByName(name: string): Promise<IStreamingTypeResponse | null>;
  addGenre(id: string | Types.ObjectId, genres: IGenreReference[]): Promise<IStreamingTypeResponse | null>;
  findByGenreName(genreName: string, id: string | Types.ObjectId): Promise<IStreamingTypeResponse | null>;
  deleteByGenresName(genresName: string[], id: string | Types.ObjectId): Promise<IStreamingTypeResponse | null>;
}

export interface ISeriesRepository extends IBaseRepository<ISeriesResponse, ISeriesCreate, ISeriesUpdate>{
  findByTitle(title: string, skip?: number, limit?: number): Promise<ISeriesResponse[] | null>;
  findByGenre(genre: string, skip: number, limit: number): Promise<ISeriesResponse[] | null>;
}

export interface ISeasonRepository extends IBaseRepository<ISeasonResponse, ISeasonCreate, ISeasonUpdate>{
  findBySeriesId(seriesId: string | Types.ObjectId, skip: number, limit: number): Promise<ISeasonResponse[] | null>;
  findEpisodesBySeasonNumber(seriesId: string | Types.ObjectId, seasonNumber: number): Promise<ISeasonResponse | null>;
}

export interface IGenreRepository extends IBaseRepository<IGenreResponse, IGenreCreate, IGenreUpdate>{
  findByName(name: string): Promise<IGenreResponse | null>; 
}
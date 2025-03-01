import { IMovie } from '../models/movieModel';
import { IUserResponse, IUserUpdate, IUserCreate } from './user';
import { IUserStreamingHistoryResponse, WatchHistoryEntry } from './userStreamingHistory';
import { ISeriesCreate, ISeriesResponse } from './series/series';
import { IStreamingTypeCreate, IStreamingTypeResponse, IStreamingTypeUpdate } from './streamingTypes';

export interface IUserService {
  registerUser(user: IUserCreate): Promise<IUserResponse>;
  loginUser(email: string, password: string): Promise<IUserResponse>;
  getUserById(id: string): Promise<IUserResponse | null>;
  updateUser(id: string, data: Partial<IUserUpdate>): Promise<IUserUpdate | null>;
  deleteUser(id: string): Promise<IUserResponse | null>;
  getAllUsers(skip: number, limit: number): Promise<IUserResponse[]>;
}

export interface IUserStreamingHistoryService {
  getUserHistory(userId: string): Promise<IUserStreamingHistoryResponse>;
  addStreamingToHistory(userId: string, streamingData: WatchHistoryEntry): Promise<IUserStreamingHistoryResponse>;
  removeStreamingFromHistory(userId: string, streamingId: string): Promise<IUserStreamingHistoryResponse | null>;
  getTotalWatchTime(userId: string): Promise<number>;
}

export interface IStreamingTypeService {
  getAllStreamingTypes(skip: number, limit: number): Promise<IStreamingTypeResponse[]>;
  getStreamingTypeById(id: string): Promise<IStreamingTypeResponse | null>;
  getStreamingTypeByName(name: string): Promise<IStreamingTypeResponse | null>;
  createStreamingType(data: IStreamingTypeCreate): Promise<IStreamingTypeCreate>;
  updateStreamingType(id: string, data: IStreamingTypeUpdate): Promise<IStreamingTypeResponse | null>;
  deleteStreamingType(id: string): Promise<IStreamingTypeResponse | null>;
}

export interface IMovieService {
  getMovies(skip: number, limit: number): Promise<any>;
  getMovieById(id: string): Promise<any>;
  getMoviesByGenre(genre: string, skip: number, limit: number): Promise<IMovie[]>;
  createMovie(movieData: any): Promise<any>;
  updateMovie(id: string, updateData: any): Promise<any>;
  deleteMovie(id: string): Promise<any>;
  getMoviesByTitle(title: string, skip?: number, limit?: number): Promise<any>;
}

export interface ISeriesService{
  getSeriesByTitle(title: string, skip: number, limit: number): Promise<ISeriesResponse[] | null>;
  createManySeries(seriesArray: ISeriesCreate[], skipCheckTitle: boolean): Promise<ISeriesResponse[] | null>;
} 
import { IMovie } from '../models/movieModel';
import { IUser } from '../models/userModel';
import { IUserStreamingHistory, StreamingHistoryEntry } from '../models/userStreamingHistoryModel';
import { ISeriesCreate, ISeriesResponse } from './series';
import { ICategory, IStreamingTypeCreate, IStreamingTypeResponse, IStreamingTypeUpdate } from './streamingTypes';

export interface IUserService {
  registerUser(user: IUser): Promise<IUser>;
  loginUser(email: string, password: string): Promise<IUser>;
  getUserById(id: string): Promise<IUser | null>;
  updateUser(id: string, data: Partial<IUser>): Promise<IUser | null>;
  deleteUser(id: string): Promise<IUser | null>;
  getAllUsers(skip: number, limit: number): Promise<IUser[]>;
}

export interface IUserStreamingHistoryService {
  getUserHistory(userId: string): Promise<IUserStreamingHistory>;
  addStreamingToHistory(userId: string, streamingData: StreamingHistoryEntry): Promise<IUserStreamingHistory>;
  removeStreamingFromHistory(userId: string, streamingId: string): Promise<IUserStreamingHistory | null>;
  getTotalWatchTime(userId: string): Promise<number>;
}

export interface IStreamingTypeService {
  getAllStreamingTypes(skip: number, limit: number): Promise<IStreamingTypeResponse[]>;
  getStreamingTypeById(id: string): Promise<IStreamingTypeResponse | null>;
  getStreamingTypeByName(name: string): Promise<IStreamingTypeResponse | null>;
  createStreamingType(data: IStreamingTypeCreate): Promise<IStreamingTypeCreate>;
  updateStreamingType(id: string, data: IStreamingTypeUpdate): Promise<IStreamingTypeUpdate | null>;
  deleteStreamingType(id: string): Promise<IStreamingTypeResponse | null>;
  addCategoryToStreamingType(id: string, category: ICategory[]): Promise<IStreamingTypeResponse | null>;
  removeCategoryFromStreamingType(id: string, category: ICategory[]): Promise<IStreamingTypeResponse | null>;
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
  createManySeries(seriesArray: ISeriesCreate[]): Promise<ISeriesResponse[] | null>;
} 
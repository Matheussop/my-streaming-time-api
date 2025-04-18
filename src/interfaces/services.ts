import { IUserResponse, IUserUpdate} from './user';
import { EpisodeWatched, IUserStreamingHistoryResponse, WatchHistoryEntry } from './userStreamingHistory';
import { ISeriesCreate, ISeriesResponse } from './series/series';
import { IStreamingTypeCreate, IStreamingTypeResponse, IStreamingTypeUpdate, IGenreReference } from './streamingTypes';
import { IGenreCreate, IGenreResponse, IGenreUpdate } from './genres';
import { IMovieResponse } from './movie';
import { ISeasonCreate, ISeasonResponse, ISeasonUpdate } from './series/season';
import { Types } from 'mongoose';
import { ContentTypeDistribution, GenrePreferenceStats, SeriesProgressStats, UserWatchingStats, WatchingPatternStats, WatchTimeStats } from './statistics';

export interface IUserService {
  getUserById(id: string | Types.ObjectId): Promise<IUserResponse | null>;
  updateUser(id: string | Types.ObjectId, data: Partial<IUserUpdate>): Promise<IUserUpdate | null>;
  deleteUser(id: string | Types.ObjectId): Promise<IUserResponse | null>;
  getAllUsers(skip: number, limit: number): Promise<IUserResponse[]>;
}

export interface IUserStreamingHistoryService {
  getUserHistory(userId: string | Types.ObjectId  ): Promise<IUserStreamingHistoryResponse>;
  addStreamingToHistory(userId: string | Types.ObjectId, streamingData: WatchHistoryEntry): Promise<IUserStreamingHistoryResponse>;
  removeStreamingFromHistory(userId: string | Types.ObjectId, contentId: string | Types.ObjectId): Promise<IUserStreamingHistoryResponse | null>;
  removeEpisodeFromHistory(userId: string | Types.ObjectId, contentId: string | Types.ObjectId, episodeId: string | Types.ObjectId): Promise<WatchHistoryEntry | null>;
  getTotalWatchTime(userId: string | Types.ObjectId): Promise<number>;
  addEpisodeToHistory(userId: string | Types.ObjectId, contentId: string | Types.ObjectId, episodeData: EpisodeWatched): Promise<WatchHistoryEntry | null>;
  getEpisodesWatched(userId: string | Types.ObjectId, contentId: string | Types.ObjectId): Promise<Map<string, EpisodeWatched> | null>;
}

export interface IStatisticsService {
  getWatchTimeStats(userData: IUserStreamingHistoryResponse): WatchTimeStats
  getContentTypeDistribution(userData: IUserStreamingHistoryResponse): ContentTypeDistribution
  getSeriesProgressStats(userData: IUserStreamingHistoryResponse): SeriesProgressStats
  getGenrePreferences(userData: IUserStreamingHistoryResponse): Promise<GenrePreferenceStats>
  getWatchingPatterns(userData: IUserStreamingHistoryResponse): WatchingPatternStats

  getAllStats(userData: IUserStreamingHistoryResponse): Promise<UserWatchingStats>
}
export interface IStreamingTypeService {
  getAllStreamingTypes(skip: number, limit: number): Promise<IStreamingTypeResponse[]>;
  getStreamingTypeById(id: string | Types.ObjectId): Promise<IStreamingTypeResponse | null>;
  getStreamingTypeByName(name: string): Promise<IStreamingTypeResponse | null>;
  createStreamingType(data: IStreamingTypeCreate): Promise<IStreamingTypeCreate>;
  updateStreamingType(id: string | Types.ObjectId, data: IStreamingTypeUpdate): Promise<IStreamingTypeResponse | null>;
  addGenreToStreamingType(id: string, genres: IGenreReference[]): Promise<IStreamingTypeResponse>;
  deleteStreamingType(id: string | Types.ObjectId): Promise<IStreamingTypeResponse | null>;
  deleteGenresFromStreamingTypeByName(id: string, genresName: string[]): Promise<IStreamingTypeResponse | null>;
}

export interface IContentService {
  getContentList(skip: number, limit: number): Promise<any>;
  getContentById(id: string | Types.ObjectId): Promise<any>;
  getContentByGenre(genre: string, skip: number, limit: number): Promise<any>;
  getContentByTitle(title: string, skip?: number, limit?: number): Promise<any>;
}

export interface IMovieService {
  getMovies(skip: number, limit: number): Promise<any>;
  getMovieById(id: string | Types.ObjectId): Promise<any>;
  getMoviesByGenre(genre: string, skip: number, limit: number): Promise<IMovieResponse[]>;
  createMovie(movieData: any): Promise<any>;
  updateMovie(id: string | Types.ObjectId, updateData: any): Promise<any>;
  deleteMovie(id: string | Types.ObjectId): Promise<any>;
  getMoviesByTitle(title: string, skip?: number, limit?: number): Promise<any>;
}

export interface ISeriesService{
  getSeriesByTitle(title: string, skip: number, limit: number): Promise<ISeriesResponse[] | null>;
  getSeriesByGenre(genre: string, skip: number, limit: number): Promise<ISeriesResponse[] | null>;
  createManySeries(seriesArray: ISeriesCreate[], skipCheckTitle: boolean): Promise<ISeriesResponse | ISeriesResponse[]>;
  getSeriesByTMDBId(tmdbId: number[]): Promise<ISeriesResponse[] | null>;
} 

export interface ISeasonService {
  getSeasons(skip: number, limit: number): Promise<ISeasonResponse[] | null>;
  getSeasonsBySeriesId(seriesId: string | Types.ObjectId, skip: number, limit: number): Promise<ISeasonResponse[] | null>;
  getSeasonById(id: string | Types.ObjectId): Promise<ISeasonResponse | null>;
  getEpisodesBySeasonNumber(seriesId: string | Types.ObjectId, seasonNumber: number): Promise<ISeasonResponse | null>;
  createSeason(season: ISeasonCreate | ISeasonCreate[]): Promise<ISeasonResponse | ISeasonResponse[]>;
  updateSeason(id: string | Types.ObjectId, season: ISeasonUpdate): Promise<ISeasonResponse | null>;
  deleteSeason(id: string | Types.ObjectId): Promise<ISeasonResponse | null>;
}

export interface IGenreService {
  getGenreById(id: string | Types.ObjectId): Promise<IGenreResponse | null>;
  getGenreByName(name: string): Promise<IGenreResponse | null>;
  getAllGenres(skip: number, limit: number): Promise<IGenreResponse[]>;
  createGenre(genre: IGenreCreate | IGenreCreate[]): Promise<IGenreResponse | IGenreResponse[]>;
  updateGenre(id: string | Types.ObjectId, genre: IGenreUpdate): Promise<IGenreResponse | null>;
  deleteGenre(genreId: string | Types.ObjectId): Promise<IGenreResponse | null>;
}
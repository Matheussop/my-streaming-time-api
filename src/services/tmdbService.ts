import axios from 'axios';
import logger from '../config/logger';
import { StreamingServiceError } from '../middleware/errorHandler';
import { Types } from "mongoose";

export class TMDBService {

  async fetchDataFromTMDB(tmdbId: number, streamingType: 'movie' | 'series'): Promise<any> {
    if (!process.env.TMDB_Bearer_Token || process.env.TMDB_Bearer_Token === '') {
      throw new StreamingServiceError('Invalid TMDB_Bearer_Token', 401);
    }
    const type = streamingType === 'series' ? 'tv' : 'movie';
    // append_to_response its means that we want to get an additional attribute in the response.
    const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?append_to_response=videos&language=en-US`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_Bearer_Token}`
      }
    }
    try {
      const response = await axios.get(url, options);
      return response.data;
    } catch (error: any) {
      logger.error({
        message: 'Error fetching data from TMDB',
        tmdbId,
        error: error.message,
      });
      throw new StreamingServiceError('Error fetching data from TMDB', 500);
    }
  }

  async updateData(repository: any, id: string | Types.ObjectId, tmdbData: any): Promise<void> {
    try {
      const updateData: any = {};
      
      if (tmdbData.runtime) {
        updateData.durationTime = tmdbData.runtime;
      }
      
      if (tmdbData.status) {
        updateData.status = tmdbData.status;
      }
      
      if (tmdbData.videos && tmdbData.videos.results) {
        const trailer = tmdbData.videos.results.find((video: any) => video.type === 'Trailer');
        if (trailer) {
          updateData.videoUrl = trailer.key;
        }
      }
      
      await repository.update(id, updateData);
    } catch (error: any) {
      logger.error({
        message: 'Error updating data',
        id,
        error: error.message,
      });
      throw new StreamingServiceError('Error updating data', 500);
    }
  }

  async fetchEpisodes(seriesId: number, seasonNumber: number): Promise<any> {
    if (!process.env.TMDB_Bearer_Token || process.env.TMDB_Bearer_Token === '') {
      throw new StreamingServiceError('Invalid TMDB_Bearer_Token', 401);
    }
    const url = `https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}?language=en-US`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_Bearer_Token}`
      }
    }
    try {
      const response = await axios.get(url, options);
      return response.data;
    } catch (error: any) {
      logger.error({
        message: 'Error fetching episodes',
        seriesId,
        seasonNumber,
        error: error.message,
      });
      throw new StreamingServiceError('Error fetching episodes', 500);
    }
  }

  async fetchMovieGenres(): Promise<any[]> {
    if (!process.env.TMDB_Bearer_Token || process.env.TMDB_Bearer_Token === '') {
      throw new StreamingServiceError('Invalid TMDB_Bearer_Token', 401);
    }
    
    const url = 'https://api.themoviedb.org/3/genre/movie/list?language=en-US';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_Bearer_Token}`
      }
    }
    
    try {
      const response = await axios.get(url, options);
      return response.data.genres || [];
    } catch (error: any) {
      logger.error({
        message: 'Error fetching movie genres from TMDB',
        error: error.message,
      });
      throw new StreamingServiceError('Error fetching movie genres from TMDB', 500);
    }
  }

  async fetchTVGenres(): Promise<any[]> {
    if (!process.env.TMDB_Bearer_Token || process.env.TMDB_Bearer_Token === '') {
      throw new StreamingServiceError('Invalid TMDB_Bearer_Token', 401);
    }
    
    const url = 'https://api.themoviedb.org/3/genre/tv/list?language=en-US';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_Bearer_Token}`
      }
    }
    
    try {
      const response = await axios.get(url, options);
      return response.data.genres || [];
    } catch (error: any) {
      logger.error({
        message: 'Error fetching TV genres from TMDB',
        error: error.message,
      });
      throw new StreamingServiceError('Error fetching TV genres from TMDB', 500);
    }
  }
}

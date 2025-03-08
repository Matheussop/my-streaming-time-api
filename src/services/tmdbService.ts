import axios from 'axios';
import logger from '../config/logger';
import { StreamingServiceError } from '../middleware/errorHandler';
import { Types } from "mongoose";

export class TMDBService {

  async fetchDataFromTMDB(tmdbId: string, type: 'movie' | 'series'): Promise<any> {
    if (!process.env.TMDB_Bearer_Token || process.env.TMDB_Bearer_Token === '') {
      throw new StreamingServiceError('Invalid TMDB_Bearer_Token', 401);
    }
    const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?language=pt-BR`;
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
    const updatedData = {
      durationTime: tmdbData.runtime,
      status: tmdbData.status,
      // Add more fields if necessary
    };

    try {
      await repository.update(id, updatedData);
    } catch (error: any) {
      logger.error({
        message: 'Error updating data',
        id,
        error: error.message,
      });
      throw new StreamingServiceError('Error updating data', 500);
    }
  }
}

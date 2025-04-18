import { TMDBService } from '../tmdbService';
import axios from 'axios';
import { StreamingServiceError } from '../../middleware/errorHandler';
import { ErrorMessages } from '../../constants/errorMessages';
import { Types } from 'mongoose';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TMDBService', () => {
  let tmdbService: TMDBService;
  let originalToken: string | undefined;

  const mockMovieResponse = {
    id: 1,
    title: 'Test Movie',
    overview: 'Test overview',
    poster_path: '/test.jpg',
    backdrop_path: '/backdrop.jpg',
    vote_average: 8.5,
    release_date: '2024-01-01',
    runtime: 120,
    status: 'Released',
    videos: {
      results: [
        {
          key: 'test-key',
          site: 'YouTube',
          type: 'Trailer'
        }
      ]
    }
  };

  const mockSeriesResponse = {
    id: 1,
    name: 'Test Series',
    overview: 'Test overview',
    poster_path: '/test.jpg',
    backdrop_path: '/backdrop.jpg',
    vote_average: 8.5,
    first_air_date: '2024-01-01',
    status: 'Returning Series',
    videos: {
      results: [
        {
          key: 'test-key',
          site: 'YouTube',
          type: 'Trailer'
        }
      ]
    }
  };

  const mockEpisodesResponse = {
    episodes: [
      {
        id: 1,
        name: 'Episode 1',
        overview: 'Test episode',
        runtime: 45,
        season_number: 1,
        episode_number: 1
      }
    ]
  };

  beforeEach(() => {
    originalToken = process.env.TMDB_Bearer_Token;
    process.env.TMDB_Bearer_Token = 'valid-token';
    tmdbService = new TMDBService();
  });

  afterEach(() => {
    process.env.TMDB_Bearer_Token = originalToken;
    jest.clearAllMocks();
  });

  describe('fetchDataFromTMDB', () => {
    it('should fetch movie data successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockMovieResponse });

      const result = await tmdbService.fetchDataFromTMDB(1, 'movie');

      expect(result).toEqual(mockMovieResponse);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/movie/1?append_to_response=videos&language=en-US',
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer valid-token'
          }
        }
      );
    });

    it('should fetch series data successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockSeriesResponse });

      const result = await tmdbService.fetchDataFromTMDB(1, 'series');

      expect(result).toEqual(mockSeriesResponse);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/tv/1?append_to_response=videos&language=en-US',
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer valid-token'
          }
        }
      );
    });

    it('should throw error if TMDB token is invalid', async () => {
      process.env.TMDB_Bearer_Token = '';

      await expect(tmdbService.fetchDataFromTMDB(1, 'movie'))
        .rejects.toThrow(new StreamingServiceError('Invalid TMDB_Bearer_Token', 401));
    });

    it('should throw error if API call fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API call failed'));

      await expect(tmdbService.fetchDataFromTMDB(1, 'movie'))
        .rejects.toThrow(new StreamingServiceError('Error fetching data from TMDB', 500));
    });
  });

  describe('updateData', () => {
    it('should update movie data successfully', async () => {
      const mockRepository = {
        update: jest.fn().mockResolvedValue(true)
      };

      await tmdbService.updateData(mockRepository, '123', mockMovieResponse);

      expect(mockRepository.update).toHaveBeenCalledWith('123', {
        durationTime: mockMovieResponse.runtime,
        status: mockMovieResponse.status
      });
    });

    it('should throw error if update fails', async () => {
      const mockRepository = {
        update: jest.fn().mockRejectedValue(new Error('Update failed'))
      };

      await expect(tmdbService.updateData(mockRepository, '123', mockMovieResponse))
        .rejects.toThrow(new StreamingServiceError('Error updating data', 500));
    });
  });

  describe('fetchEpisodes', () => {
    it('should fetch episodes successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockEpisodesResponse });

      const result = await tmdbService.fetchEpisodes(1, 1);

      expect(result).toEqual(mockEpisodesResponse);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/tv/1/season/1?language=en-US',
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer valid-token'
          }
        }
      );
    });

    it('should throw error if TMDB token is invalid', async () => {
      process.env.TMDB_Bearer_Token = '';

      await expect(tmdbService.fetchEpisodes(1, 1))
        .rejects.toThrow(new StreamingServiceError('Invalid TMDB_Bearer_Token', 401));
    });

    it('should throw error if API call fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API call failed'));

      await expect(tmdbService.fetchEpisodes(1, 1))
        .rejects.toThrow(new StreamingServiceError('Error fetching episodes', 500));
    });
  });
}); 
import { Types } from 'mongoose';
import { StreamingServiceError } from '../../middleware/errorHandler';
import { MovieRepository } from '../../repositories/movieRepository';
import { SeriesRepository } from '../../repositories/seriesRepository';
import { UserStreamingHistoryRepository } from '../../repositories/userStreamingHistoryRepository';
import { UserStreamingHistoryService } from '../userStreamingHistoryService';
import { IMovieResponse } from '../../interfaces/movie';
import { ISeriesResponse } from '../../interfaces/series/series';
import { IUserStreamingHistoryResponse, WatchHistoryEntry, EpisodeWatched, SeriesProgress } from '../../interfaces/userStreamingHistory';
import { describe } from 'node:test';
import { IGenreReference } from '../../interfaces/streamingTypes';
import { generateValidObjectId } from '../../util/__tests__/generateValidObjectId';

jest.mock('../../repositories/movieRepository');
jest.mock('../../repositories/seriesRepository');
jest.mock('../../repositories/userStreamingHistoryRepository');

describe('UserStreamingHistoryService', () => {
  let userStreamingHistoryService: UserStreamingHistoryService;
  let mockUserStreamingHistoryRepository: jest.Mocked<UserStreamingHistoryRepository>;
  let mockMovieRepository: jest.Mocked<MovieRepository>;
  let mockSeriesRepository: jest.Mocked<SeriesRepository>;

  const mockUserId = generateValidObjectId();
  const mockContentId = generateValidObjectId();
  const mockEpisodeId = generateValidObjectId();

  const mockGenre: IGenreReference = {
    _id: new Types.ObjectId(),
    name: 'Action',
    id: 1,
    poster: 'poster.jpg'
  };

  const mockMovie: IMovieResponse = {
    _id: mockContentId,
    title: 'Test Movie',
    contentType: 'movie',
    durationTime: 120,
    releaseDate: '2024-03-20T00:00:00.000Z',
    plot: 'Test plot',
    cast: ['Actor 1', 'Actor 2'],
    genre: [mockGenre],
    rating: 8.5,
    poster: 'poster.jpg',
    url: 'movie.mp4'
  } as unknown as IMovieResponse;

  const mockSeries: ISeriesResponse = {
    _id: mockContentId,
    title: 'Test Series',
    contentType: 'series',
    seasons: [],
    releaseDate: '2024-03-20T00:00:00.000Z',
    plot: 'Test plot',
    cast: ['Actor 1', 'Actor 2'],
    genre: [mockGenre],
    rating: 8.5,
    poster: 'poster.jpg',
    url: 'series.mp4'
  } as unknown as ISeriesResponse;

  const mockWatchHistoryEntry: WatchHistoryEntry = {
    contentId: mockContentId.toString(),
    title: 'Test Movie',
    contentType: 'movie',
    watchedDurationInMinutes: 120,
    watchedAt: new Date('2024-03-20T00:00:00.000Z'),
    seriesProgress: new Map()
  };

  const mockEpisodeWatched: EpisodeWatched = {
    episodeId: mockEpisodeId.toString(),
    seasonNumber: 1,
    episodeNumber: 1,
    watchedDurationInMinutes: 45,
    watchedAt: new Date('2024-03-20T00:00:00.000Z'),
    completionPercentage: 100
  };

  const mockSeriesProgress: SeriesProgress = {
    totalEpisodes: 10,
    watchedEpisodes: 1,
    completed: false,
    episodesWatched: new Map([[mockEpisodeId.toString(), mockEpisodeWatched]])
  };

  const mockUserHistory: IUserStreamingHistoryResponse = {
    _id: new Types.ObjectId(),
    userId: mockUserId,
    totalWatchTimeInMinutes: 120,
    watchHistory: [mockWatchHistoryEntry],
    createdAt: new Date('2024-03-20T00:00:00.000Z'),
    updatedAt: new Date('2024-03-20T00:00:00.000Z')
  };

  beforeEach(() => {
    mockUserStreamingHistoryRepository = new UserStreamingHistoryRepository() as jest.Mocked<UserStreamingHistoryRepository>;
    mockMovieRepository = new MovieRepository() as jest.Mocked<MovieRepository>;
    mockSeriesRepository = new SeriesRepository() as jest.Mocked<SeriesRepository>;

    userStreamingHistoryService = new UserStreamingHistoryService(
      mockUserStreamingHistoryRepository,
      mockMovieRepository,
      mockSeriesRepository
    );
  });

  describe('getUserHistory', () => {
    it('should return user history if found', async () => {
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(mockUserHistory);

      const result = await userStreamingHistoryService.getUserHistory(mockUserId);

      expect(mockUserStreamingHistoryRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockUserHistory);
    });

    it('should throw an error if history is not found', async () => {
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(null);

      await expect(userStreamingHistoryService.getUserHistory(mockUserId))
        .rejects.toThrow(new StreamingServiceError('User history not found', 404));
    });
  });

  describe('addStreamingToHistory', () => {
    it('should add streaming to history successfully', async () => {
      mockSeriesRepository.findById.mockResolvedValue(mockSeries);
      const mockWatchHistoryEntryWithSeries = {
        ...mockWatchHistoryEntry,
        contentType: 'series',
        title: 'Test Series',
        contentId: generateValidObjectId(),
      } as unknown as WatchHistoryEntry;

      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(mockUserHistory);

      const mockUserHistoryWithNewSeries = {...mockUserHistory, 
        watchHistory: [
          ...mockUserHistory.watchHistory,
          mockWatchHistoryEntryWithSeries
        ]
      }
      mockUserStreamingHistoryRepository.addWatchHistoryEntry.mockResolvedValue(mockUserHistoryWithNewSeries);

      const result = await userStreamingHistoryService.addStreamingToHistory(mockUserId, mockWatchHistoryEntryWithSeries);

      expect(mockUserStreamingHistoryRepository.addWatchHistoryEntry).toHaveBeenCalledWith(mockUserId, mockWatchHistoryEntryWithSeries);
      expect(result).toEqual(mockUserHistoryWithNewSeries);
    });

    it('should throw an error if streaming is not found', async () => {
      mockMovieRepository.findById.mockResolvedValue(null);
      mockSeriesRepository.findById.mockResolvedValue(null);

      await expect(userStreamingHistoryService.addStreamingToHistory(mockUserId, mockWatchHistoryEntry))
        .rejects.toThrow(new StreamingServiceError('Streaming not found', 404));
    });

    it('should throw an error if streaming title in history is different', async () => {
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(mockUserHistory);
      mockSeriesRepository.findById.mockResolvedValue(mockSeries);

      const mockWatchHistoryEntryWithDifferentTitle = {
        ...mockWatchHistoryEntry,
        title: 'Different Title'
      } as unknown as WatchHistoryEntry;

      await expect(userStreamingHistoryService.addStreamingToHistory(mockUserId, mockWatchHistoryEntryWithDifferentTitle))
        .rejects.toThrow(new StreamingServiceError('Streaming title does not match', 400));
    });

    it('should throw an error if streaming title in history is different', async () => {
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(mockUserHistory);
      mockMovieRepository.findById.mockResolvedValue(mockMovie);

      const mockWatchHistoryEntryWithDifferentTitle = {
        ...mockWatchHistoryEntry,
        contentType: 'series'
      } as unknown as WatchHistoryEntry;

      await expect(userStreamingHistoryService.addStreamingToHistory(mockUserId, mockWatchHistoryEntryWithDifferentTitle))
        .rejects.toThrow(new StreamingServiceError('Content type does not match', 400));
    });

    it('should throw an error if streaming is already in history', async () => {
      mockMovieRepository.findById.mockResolvedValue(mockMovie);
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(mockUserHistory);

      await expect(userStreamingHistoryService.addStreamingToHistory(mockUserId, mockWatchHistoryEntry))
        .rejects.toThrow(new StreamingServiceError('Streaming already in history', 400));
    });
    
  });

  describe('removeStreamingFromHistory', () => {
    it('should remove streaming from history successfully', async () => {
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(mockUserHistory);
      mockUserStreamingHistoryRepository.removeWatchHistoryEntry.mockResolvedValue(mockUserHistory);

      const result = await userStreamingHistoryService.removeStreamingFromHistory(mockUserId, mockContentId);

      expect(mockUserStreamingHistoryRepository.removeWatchHistoryEntry).toHaveBeenCalledWith(mockUserId, mockContentId);
      expect(result).toEqual(mockUserHistory);
    });

    it('should throw an error if streaming is not found in history', async () => {
      const historyWithoutStreaming = { ...mockUserHistory, watchHistory: [] };
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(historyWithoutStreaming);

      await expect(userStreamingHistoryService.removeStreamingFromHistory(mockUserId, mockContentId))
        .rejects.toThrow(new StreamingServiceError('Streaming not found in history', 404));
    });

    it('should throw an error if removeWatchHistoryEntry fails', async () => {
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(mockUserHistory);
      mockUserStreamingHistoryRepository.removeWatchHistoryEntry.mockRejectedValue(new Error('Failed to remove streaming from history'));

      await expect(userStreamingHistoryService.removeStreamingFromHistory(mockUserId, mockContentId))
        .rejects.toThrow(new StreamingServiceError('Failed to remove streaming from history', 404));
    });

    it('should throw an error if removeWatchHistoryEntry returns null', async () => {
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(mockUserHistory);
      mockUserStreamingHistoryRepository.removeWatchHistoryEntry.mockResolvedValue(null);

      await expect(userStreamingHistoryService.removeStreamingFromHistory(mockUserId, mockContentId))
        .rejects.toThrow(new StreamingServiceError('Failed to update history', 404));
    });
  });

  describe('removeEpisodeFromHistory', () => {
    it('should remove episode from history successfully', async () => {
      const historyWithEpisode = {
        ...mockUserHistory,
        watchHistory: [{
          ...mockWatchHistoryEntry,
          seriesProgress: new Map([[mockContentId.toString(), mockSeriesProgress]])
        }]
      };
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(historyWithEpisode);
      mockUserStreamingHistoryRepository.removeEpisodeFromHistory.mockResolvedValue(mockWatchHistoryEntry);

      const result = await userStreamingHistoryService.removeEpisodeFromHistory(mockUserId, mockContentId, mockEpisodeId);

      expect(mockUserStreamingHistoryRepository.removeEpisodeFromHistory).toHaveBeenCalledWith(mockUserId, mockContentId, mockEpisodeId);
      expect(result).toEqual(mockWatchHistoryEntry);
    });

    it('should throw an error if episode is not found in history', async () => {
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(mockUserHistory);

      await expect(userStreamingHistoryService.removeEpisodeFromHistory(mockUserId, mockContentId, mockEpisodeId))
        .rejects.toThrow(new StreamingServiceError('Episode not found in history', 404));
    });

    it('should throw an error if seriesProgress is null', async () => {
      const historyWithoutSeriesProgress = { ...mockUserHistory, watchHistory: [{ ...mockWatchHistoryEntry, seriesProgress: null }] } as unknown as IUserStreamingHistoryResponse;
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(historyWithoutSeriesProgress);

      await expect(userStreamingHistoryService.removeEpisodeFromHistory(mockUserId, mockContentId, mockEpisodeId))
        .rejects.toThrow(new StreamingServiceError('Episode not found in history', 404));
    });

    it('should throw an error if removeEpisodeFromHistory returns null', async () => {
      const historyWithEpisode = {
        ...mockUserHistory,
        watchHistory: [{
          ...mockWatchHistoryEntry,
          seriesProgress: new Map([[mockContentId.toString(), mockSeriesProgress]])
        }]
      };
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(historyWithEpisode);
      
      mockUserStreamingHistoryRepository.removeEpisodeFromHistory.mockResolvedValue(null);

      await expect(userStreamingHistoryService.removeEpisodeFromHistory(mockUserId, mockContentId, mockEpisodeId))
        .rejects.toThrow(new StreamingServiceError('Failed to update history', 404));
    });
  });

  describe('addEpisodeToHistory', () => {
    it('should add episode to history successfully', async () => {
      mockUserStreamingHistoryRepository.updateEpisodeProgress.mockResolvedValue(mockWatchHistoryEntry);

      const result = await userStreamingHistoryService.addEpisodeToHistory(mockUserId, mockContentId, mockEpisodeWatched);

      expect(mockUserStreamingHistoryRepository.updateEpisodeProgress).toHaveBeenCalledWith(mockUserId, mockContentId, mockEpisodeWatched);
      expect(result).toEqual(mockWatchHistoryEntry);
    });

    it('should throw an error if update fails', async () => {
      mockUserStreamingHistoryRepository.updateEpisodeProgress.mockResolvedValue(null);

      await expect(userStreamingHistoryService.addEpisodeToHistory(mockUserId, mockContentId, mockEpisodeWatched))
        .rejects.toThrow(new StreamingServiceError('Failed to update history', 404));
    });
  });

  describe('markSeasonAsWatched', () => {
    it('should mark season as watched', async () => {
      const episodes = [{
        _id: mockEpisodeId.toString(),
        episodeNumber: 1,
        durationInMinutes: 45,
      }];
      const season = { episodes } as any;
      jest.spyOn(mockUserStreamingHistoryRepository, 'updateEpisodeProgress').mockResolvedValue(mockWatchHistoryEntry);
      const seasonRepo = (userStreamingHistoryService as any).seasonRepository;
      jest.spyOn(seasonRepo, 'findEpisodesBySeasonNumber').mockResolvedValue(season);

      const result = await userStreamingHistoryService.markSeasonAsWatched(mockUserId, mockContentId, 1);

      expect(seasonRepo.findEpisodesBySeasonNumber).toHaveBeenCalledWith(mockContentId, 1);
      expect(mockUserStreamingHistoryRepository.updateEpisodeProgress).toHaveBeenCalled();
      expect(result).toEqual(mockWatchHistoryEntry);
    });
  });

  describe('getEpisodesWatched', () => {
    it('should return episodes watched for a series', async () => {
      const historyWithEpisodes = {
        ...mockUserHistory,
        watchHistory: [{
          ...mockWatchHistoryEntry,
          seriesProgress: new Map([[mockContentId.toString(), mockSeriesProgress]])
        }]
      };
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(historyWithEpisodes);

      const result = await userStreamingHistoryService.getEpisodesWatched(mockUserId, mockContentId);

      expect(result).toEqual(mockSeriesProgress.episodesWatched);
    });

    it('should return null if no episodes are watched', async () => {
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(mockUserHistory);

      const result = await userStreamingHistoryService.getEpisodesWatched(mockUserId, mockContentId);

      expect(result).toBeNull();
    });

    it('should throw an error if watchHistory is empty', async () => {
      const historyWithoutWatchHistory = { ...mockUserHistory, watchHistory: [] } as unknown as IUserStreamingHistoryResponse;
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(historyWithoutWatchHistory);

      const result = await userStreamingHistoryService.getEpisodesWatched(mockUserId, mockContentId);

      expect(result).toBeNull();
    });

    it('should throw an error if seriesProgress is null', async () => {
      const historyWithoutSeriesProgress = { ...mockUserHistory, watchHistory: [{ ...mockWatchHistoryEntry, seriesProgress: null }] } as unknown as IUserStreamingHistoryResponse;
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(historyWithoutSeriesProgress);

      const result = await userStreamingHistoryService.getEpisodesWatched(mockUserId, mockContentId);

      expect(result).toBeNull();
    });
  });

  describe('getTotalWatchTime', () => {
    it('should return total watch time in minutes', async () => {
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(mockUserHistory);

      const result = await userStreamingHistoryService.getTotalWatchTime(mockUserId);

      expect(result).toBe(mockUserHistory.totalWatchTimeInMinutes);
    });

    it('should throw an error if findByUserId returns totalWatchTimeInMinutes as null', async () => {
      const historyWithTotalWatchTime = { ...mockUserHistory, totalWatchTimeInMinutes: null } as unknown as IUserStreamingHistoryResponse;
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(historyWithTotalWatchTime);

      const result = await userStreamingHistoryService.getTotalWatchTime(mockUserId);

      expect(result).toBe(0);
    });
  });

  describe('getByUserIdAndStreamingId', () => {
    it('should return true if streaming is in history', async () => {
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(mockUserHistory);
      const result = await userStreamingHistoryService.getByUserIdAndStreamingId(mockUserId, mockContentId);

      expect(result).toBe(true);
    });

    it('should return false if streaming is not in history', async () => {
      const historyWithoutStreaming = { ...mockUserHistory, watchHistory: [] };
      mockUserStreamingHistoryRepository.findByUserId.mockResolvedValue(historyWithoutStreaming);

      const result = await userStreamingHistoryService.getByUserIdAndStreamingId(mockUserId, mockContentId);

      expect(result).toBe(false);
    });
  });
});


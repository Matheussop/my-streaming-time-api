import { NextFunction, Request, Response } from 'express';
import { UserStreamingHistoryService } from '../../services/userStreamingHistoryService';
import { generateValidObjectId } from '../../util/__tests__/generateValidObjectId';
import { UserStreamingHistoryController } from '../userStreamingHistoryController';
import { Types } from 'mongoose';
import { IUserStreamingHistoryResponse, WatchHistoryEntry, EpisodeWatched, SeriesProgress } from '../../interfaces/userStreamingHistory';
import { UserStreamingHistoryRepository } from '../../repositories/userStreamingHistoryRepository';
import { SeriesRepository } from '../../repositories/seriesRepository';
import { MovieRepository } from '../../repositories/movieRepository';

jest.mock('../../services/userStreamingHistoryService');

describe('UserStreamingHistoryController', () => {
  let controller: UserStreamingHistoryController;
  let mockService: jest.Mocked<UserStreamingHistoryService>;
  let mockUserStreamingHistoryRepository: jest.Mocked<UserStreamingHistoryRepository>;
  let mockMovieRepository: jest.Mocked<MovieRepository>;
  let mockSeriesRepository: jest.Mocked<SeriesRepository>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let mockHistory: IUserStreamingHistoryResponse;
  let validId: Types.ObjectId;
  let mockSeriesProgress: SeriesProgress;
  let mockWatchHistoryEntry: WatchHistoryEntry[];
  
  beforeAll(() => {
    validId = new Types.ObjectId(generateValidObjectId());
    mockSeriesProgress = {
      totalEpisodes: 10,
      watchedEpisodes: 5,
      lastWatched: {
        seasonNumber: 1,
        episodeNumber: 1,
        episodeId: validId.toString(),
        completionPercentage: 100,
        watchedAt: new Date()
      },
      
      episodesWatched: new Map([["1-1", {
        episodeId: validId.toString(),
        seasonNumber: 1,
        episodeNumber: 1,
        watchedDurationInMinutes: 120,
        completionPercentage: 100,
        watchedAt: new Date()
      }]]),
      nextToWatch: {
        seasonNumber: 1,
        episodeNumber: 1,
        episodeId: validId.toString()
      },
      completed: false
    }

    mockWatchHistoryEntry = [{
      contentId: validId,
      contentType: 'movie',
      title: 'Test Movie',
      watchedDurationInMinutes: 120,
      completionPercentage: 100,
    }];
  });
  beforeEach(() => {
    mockHistory = {
      _id: validId,
      userId: validId,
      watchHistory: mockWatchHistoryEntry,
      totalWatchTimeInMinutes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    } as IUserStreamingHistoryResponse;

    mockUserStreamingHistoryRepository = {} as jest.Mocked<UserStreamingHistoryRepository>;
    mockMovieRepository = {} as jest.Mocked<MovieRepository>;
    mockSeriesRepository = {} as jest.Mocked<SeriesRepository>;
    mockService = new UserStreamingHistoryService(
      mockUserStreamingHistoryRepository,
      mockMovieRepository,
      mockSeriesRepository
    ) as jest.Mocked<UserStreamingHistoryService>;
    controller = new UserStreamingHistoryController(mockService);
    mockReq = {
      body: {},
      params: {},
      validatedIds: {},
      method: 'GET',
      path: '/user-streaming-history'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(() => mockRes),
      send: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('getUserStreamingHistory', () => {
    it('should return user streaming history', async () => {
      const userId = validId;
      mockReq.validatedIds = { userId };

      mockService.getUserHistory.mockResolvedValue(mockHistory);

      await controller.getUserStreamingHistory(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getUserHistory).toHaveBeenCalledWith(userId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ history: mockHistory });
    });
  });

  describe('addStreamingToHistory', () => {
    it('should add streaming to history', async () => {
      const userId = validId;
      const historyData = {
        contentId: validId,
        title: 'Test Movie',
        contentType: 'movie' as const,
        watchedDurationInMinutes: 120,
        completionPercentage: 100,
        episodeId: validId,
        seasonNumber: 1,
        episodeNumber: 1,
        rating: 5
      };
      mockReq.body = {userId, ...historyData};

      const watchHistoryEntry = historyData;

      mockService.addStreamingToHistory.mockResolvedValue(mockHistory);

      await controller.addStreamingToHistory(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.addStreamingToHistory).toHaveBeenCalledWith(
        userId,
        watchHistoryEntry
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Streaming entry added successfully', 
        history: mockHistory 
      });
    });
  });

  describe('removeStreamingFromHistory', () => {
    it('should remove streaming from history', async () => {
      const userId = validId;
      const contentId = validId;
      mockReq.query = { userId: userId.toString(), contentId: contentId.toString() };

      mockService.removeStreamingFromHistory.mockResolvedValue(mockHistory);

      await controller.removeStreamingFromHistory(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.removeStreamingFromHistory).toHaveBeenCalledWith(userId.toString(), contentId.toString());
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Streaming entry removed successfully', 
        history: mockHistory 
      });
    });
  });

  describe('removeEpisodeFromHistory', () => {
    it('should remove episode from history', async () => {
      const userId = validId;
      const contentId = validId;
      const episodeId = validId;
      mockReq.query = { 
        userId: userId.toString(), 
        contentId: contentId.toString(),
        episodeId: episodeId.toString()
      };

      const watchHistoryEntry: WatchHistoryEntry = {
        contentId: contentId,
        contentType: 'series',
        title: 'Test Series',
        watchedDurationInMinutes: 45,
        completionPercentage: 100,
        rating: 5,
        watchedAt: new Date(),
        seriesProgress: new Map()
      };

      mockService.removeEpisodeFromHistory.mockResolvedValue(watchHistoryEntry);

      await controller.removeEpisodeFromHistory(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.removeEpisodeFromHistory).toHaveBeenCalledWith(
        userId.toString(), 
        contentId.toString(),
        episodeId.toString()
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Episode removed successfully', 
        history: watchHistoryEntry 
      });
    });
  });

  describe('calculateTotalWatchTime', () => {
    it('should calculate total watch time', async () => {
      const userId = validId;
      mockReq.validatedIds = { userId };

      const totalTime = 180;
      mockService.getTotalWatchTime.mockResolvedValue(totalTime);

      await controller.calculateTotalWatchTime(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getTotalWatchTime).toHaveBeenCalledWith(userId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ totalWatchTimeInMinutes: totalTime });
    });
  });

  describe('getByUserIdAndStreamingId', () => {
    it('should get history by user id and streaming id', async () => {
      const userId = validId;
      const contentId = validId;
      mockReq.query = { userId: userId.toString(), contentId: contentId.toString() };

      const viewed = true;
      mockService.getByUserIdAndStreamingId.mockResolvedValue(viewed);

      await controller.getByUserIdAndStreamingId(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getByUserIdAndStreamingId).toHaveBeenCalledWith(
        userId.toString(), 
        contentId.toString()
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ viewed });
    });
  });

  describe('addEpisodeToHistory', () => {
    it('should add episode to history', async () => {
      const userId = validId;
      const contentId = validId;
      const episodeData: EpisodeWatched = {
        episodeId: validId.toString(),
        seasonNumber: 1,
        episodeNumber: 1,
        watchedDurationInMinutes: 45,
        completionPercentage: 100,
        watchedAt: new Date()
      };
      mockReq.body = { userId, contentId, episodeData };

      const watchHistoryEntry: WatchHistoryEntry = {
        contentId: contentId,
        contentType: 'series',
        title: 'Test Series',
        watchedDurationInMinutes: episodeData.watchedDurationInMinutes,
        completionPercentage: episodeData.completionPercentage,
        rating: 5,
        watchedAt: new Date(),
        seriesProgress: new Map()
      };

      mockService.addEpisodeToHistory.mockResolvedValue(watchHistoryEntry);

      await controller.addEpisodeToHistory(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.addEpisodeToHistory).toHaveBeenCalledWith(
        userId,
        contentId,
        episodeData
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Episode added to history successfully', 
        history: watchHistoryEntry 
      });
    });
  });

  describe('getEpisodesWatched', () => {
    it('should get episodes watched', async () => {
      const userId = validId;
      const contentId = validId;
      mockReq.query = { userId: userId.toString(), contentId: contentId.toString() };

      const episodesWatched = new Map<string, EpisodeWatched>();
      episodesWatched.set('1-1', {
        episodeId: validId.toString(),
        seasonNumber: 1,
        episodeNumber: 1,
        watchedDurationInMinutes: 45,
        completionPercentage: 100,
        watchedAt: new Date()
      });

      mockService.getEpisodesWatched.mockResolvedValue(episodesWatched);

      await controller.getEpisodesWatched(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getEpisodesWatched).toHaveBeenCalledWith(
        userId.toString(), 
        contentId.toString()
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(episodesWatched);
    });
  });
});

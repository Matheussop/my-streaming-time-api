import { NextFunction, Request, Response } from 'express';
import { StatisticsController } from '../statisticsController';
import { StatisticsService } from '../../services/statisticsService';
import { UserStreamingHistoryService } from '../../services/userStreamingHistoryService';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/__tests__/generateValidObjectId';
import { IUserStreamingHistoryResponse } from '../../interfaces/userStreamingHistory';
import { WatchTimeStats, ContentTypeDistribution, SeriesProgressStats, GenrePreferenceStats, WatchingPatternStats, UserWatchingStats } from '../../interfaces/statistics';
import { ContentService } from '../../services/commonService';
import { ContentRepository } from '../../repositories/contentRepository';
import { UserStreamingHistoryRepository } from '../../repositories/userStreamingHistoryRepository';
import { SeriesRepository } from '../../repositories/seriesRepository';
import { MovieRepository } from '../../repositories/movieRepository';

jest.mock('../../services/statisticsService');
jest.mock('../../services/userStreamingHistoryService');


/**
 * Important to mock catchAsync so that the test is not impacted
 * by the promise that catchAsync returns
 */
jest.mock('../../util/catchAsync', () => ({
  catchAsync: (fn: Function) => fn
}));

describe('StatisticsController', () => {
  let controller: StatisticsController;
  let mockService: jest.Mocked<StatisticsService>;
  let mockUserStreamingHistoryService: jest.Mocked<UserStreamingHistoryService>;
  let mockContentService: jest.Mocked<ContentService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let validId: Types.ObjectId;
  let mockUserHistory: IUserStreamingHistoryResponse;
  let mockWatchTimeStats: WatchTimeStats;
  let mockContentTypeDistribution: ContentTypeDistribution;
  let mockSeriesProgressStats: SeriesProgressStats;
  let mockGenrePreferenceStats: GenrePreferenceStats;
  let mockWatchingPatternStats: WatchingPatternStats;
  let mockUserWatchingStats: UserWatchingStats;
  let mockContentRepository: ContentRepository;
  let mockUserHistoryRepository: UserStreamingHistoryRepository;
  let mockMovieRepository: MovieRepository;
  let mockSeriesRepository: SeriesRepository;

  beforeEach(() => {
    validId = new Types.ObjectId(generateValidObjectId());
    
    mockUserHistory = {
      _id: validId,
      userId: validId,
      watchHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockWatchTimeStats = {
      totalWatchTimeInMinutes: 1000,
      averageWatchTimePerDay: 120,
      averageWatchTimePerSession: 60,
      watchTimeByContentType: {
        'movie': 600,
        'series': 400
      }
    };

    mockContentTypeDistribution = {
      totalContent: 100,
      byType: {
        'movie': 60,
        'series': 40
      },
      percentageByType: {
        'movie': 60,
        'series': 40
      }
    };

    mockSeriesProgressStats = {
      series: [{
        totalWatchTimeInMinutes: 120,
        title: 'Test Series',
        totalEpisodes: 10,
        watchedEpisodes: 5,
        completionPercentage: 50,
        averageEpisodeLength: 24
      }],
      averageCompletionPercentage: 50
    };

    mockGenrePreferenceStats = {
      genreCounts: {
        'Action': 10,
        'Comedy': 5
      },
      genrePercentages: {
        'Action': 50,
        'Comedy': 25
      },
      topGenres: [{
        genre: 'Action',
        count: 10,
        percentage: 50
      }]
    };

    mockWatchingPatternStats = {
      watchCountByDay: {
        'monday': 5,
        'tuesday': 3
      },
      watchCountByHour: {
        '18': 10,
        '19': 8
      },
      mostActiveDate: new Date(),
      mostActiveDay: 'monday',
      mostActiveHour: 18,
      averageTimeBetweenEpisodes: 24
    };

    mockUserWatchingStats = {
      watchTimeStats: mockWatchTimeStats,
      contentTypeDistribution: mockContentTypeDistribution,
      seriesProgressStats: mockSeriesProgressStats,
      watchingPatternStats: mockWatchingPatternStats,
      genrePreferenceStats: mockGenrePreferenceStats
    };
    mockContentRepository = new ContentRepository();
    mockContentService = new ContentService(mockContentRepository) as jest.Mocked<ContentService>;
    mockUserHistoryRepository = new UserStreamingHistoryRepository(),
    mockMovieRepository = new MovieRepository(),
    mockSeriesRepository = new SeriesRepository(),
    mockUserStreamingHistoryService = new UserStreamingHistoryService(mockUserHistoryRepository, mockMovieRepository, mockSeriesRepository) as jest.Mocked<UserStreamingHistoryService>;
    mockService = new StatisticsService(mockContentService) as jest.Mocked<StatisticsService>;
    controller = new StatisticsController(mockService, mockUserStreamingHistoryService);
    
    mockReq = {
      body: {},
      params: {},
      validatedIds: { id: validId },
      method: 'GET',
      path: '/statistics'
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(() => mockRes),
      send: jest.fn(),
    };
    
    mockNext = jest.fn();
  });

  describe('getWatchTimeStats', () => {
    it('should return watch time statistics', async () => {
      mockUserStreamingHistoryService.getUserHistory.mockResolvedValue(mockUserHistory);
      mockService.getWatchTimeStats.mockReturnValue(mockWatchTimeStats);

      await controller.getWatchTimeStats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockUserStreamingHistoryService.getUserHistory).toHaveBeenCalledWith(validId);
      expect(mockService.getWatchTimeStats).toHaveBeenCalledWith(mockUserHistory);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockWatchTimeStats);
    });
  });

  describe('getContentTypeDistribution', () => {
    it('should return content type distribution', async () => {
      mockUserStreamingHistoryService.getUserHistory.mockResolvedValue(mockUserHistory);
      mockService.getContentTypeDistribution.mockReturnValue(mockContentTypeDistribution);

      await controller.getContentTypeDistribution(mockReq as Request, mockRes as Response, mockNext);

      expect(mockUserStreamingHistoryService.getUserHistory).toHaveBeenCalledWith(validId);
      expect(mockService.getContentTypeDistribution).toHaveBeenCalledWith(mockUserHistory);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockContentTypeDistribution);
    });
  });

  describe('getSeriesProgressStats', () => {
    it('should return series progress statistics', async () => {
      mockUserStreamingHistoryService.getUserHistory.mockResolvedValue(mockUserHistory);
      mockService.getSeriesProgressStats.mockReturnValue(mockSeriesProgressStats);

      await controller.getSeriesProgressStats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockUserStreamingHistoryService.getUserHistory).toHaveBeenCalledWith(validId);
      expect(mockService.getSeriesProgressStats).toHaveBeenCalledWith(mockUserHistory);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockSeriesProgressStats);
    });
  });

  describe('getGenrePreferences', () => {
    it('should return genre preferences statistics', async () => {
      mockUserStreamingHistoryService.getUserHistory.mockResolvedValue(mockUserHistory);
      mockService.getGenrePreferences.mockResolvedValue(mockGenrePreferenceStats);

      await controller.getGenrePreferences(mockReq as Request, mockRes as Response, mockNext);

      expect(mockUserStreamingHistoryService.getUserHistory).toHaveBeenCalledWith(validId);
      expect(mockService.getGenrePreferences).toHaveBeenCalledWith(mockUserHistory);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockGenrePreferenceStats);
    });
  });

  describe('getWatchingPatterns', () => {
    it('should return watching patterns statistics', async () => {
      mockUserStreamingHistoryService.getUserHistory.mockResolvedValue(mockUserHistory);
      mockService.getWatchingPatterns.mockReturnValue(mockWatchingPatternStats);

      await controller.getWatchingPatterns(mockReq as Request, mockRes as Response, mockNext);

      expect(mockUserStreamingHistoryService.getUserHistory).toHaveBeenCalledWith(validId);
      expect(mockService.getWatchingPatterns).toHaveBeenCalledWith(mockUserHistory);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockWatchingPatternStats);
    });
  });

  describe('getAllStats', () => {
    it('should return all statistics', async () => {
      mockUserStreamingHistoryService.getUserHistory.mockResolvedValue(mockUserHistory);
      mockService.getAllStats.mockResolvedValue(mockUserWatchingStats);

      await controller.getAllStats(mockReq as Request, mockRes as Response, mockNext);

      expect(mockUserStreamingHistoryService.getUserHistory).toHaveBeenCalledWith(validId);
      expect(mockService.getAllStats).toHaveBeenCalledWith(mockUserHistory);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUserWatchingStats);
    });
  });
}); 
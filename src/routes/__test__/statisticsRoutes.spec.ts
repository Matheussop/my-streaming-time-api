import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../constants/httpStatus';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/__tests__/generateValidObjectId';

const mockImplementations = {
  getWatchTimeStats: jest.fn(),
  getContentTypeDistribution: jest.fn(),
  getSeriesProgressStats: jest.fn(),
  getGenrePreferences: jest.fn(),
  getWatchingPatterns: jest.fn(),
  getAllStats: jest.fn()
};

jest.mock('../../controllers/statisticsController', () => ({
  StatisticsController: jest.fn().mockImplementation(() => mockImplementations),
}));

jest.mock('../../middleware/validationMiddleware', () => ({
  validate: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

jest.mock('../../middleware/objectIdValidationMiddleware', () => ({
  validateObjectId: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => {
    req.validatedIds = req.validatedIds || {};
    const id = req.params.id || req.params.userId || '507f1f77bcf86cd799439011';
    req.validatedIds.id = new Types.ObjectId(id);
    next();
  }),
}));

jest.mock('../../services/userStreamingHistoryService', () => ({
  UserStreamingHistoryService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../services/statisticsService', () => ({
  StatisticsService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../repositories/userStreamingHistoryRepository', () => ({
  UserStreamingHistoryRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../repositories/movieRepository', () => ({
  MovieRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../repositories/seriesRepository', () => ({
  SeriesRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../repositories/contentRepository', () => ({
  ContentRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../services/commonService', () => ({
  ContentService: jest.fn().mockImplementation(() => ({})),
}));

import router from '../statisticsRoutes';

describe('Statistics Routes', () => {
  let app: express.Application;
  let mockId: string | Types.ObjectId;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/statistics', router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockId = generateValidObjectId();
  });

  describe('GET /:id', () => {
    it('should return all statistics for a user', async () => {
      const mockStats = {
        watchTimeStats: {
          totalWatchTimeInMinutes: 900,
          averageWatchTimePerDay: 30,
          averageWatchTimePerSession: 45,
          watchTimeByContentType: {
            movie: 300,
            series: 600
          }
        },
        contentTypeDistribution: {
          movie: { count: 5, percentage: 20 },
          series: { count: 20, percentage: 80 }
        },
        seriesProgressStats: {
          completedSeries: 2,
          inProgressSeries: 3,
          averageCompletionPercentage: 65
        },
        genrePreferenceStats: {
          topGenres: [
            { name: 'Action', count: 10 },
            { name: 'Comedy', count: 8 }
          ],
          percentageByGenre: {
            Action: 40,
            Comedy: 32,
            Drama: 28
          }
        },
        watchingPatternStats: {
          mostActiveDay: 'Saturday',
          mostActiveHour: 20,
          mostActiveDate: '2023-06-15',
          watchCountByDay: {
            Monday: 5,
            Tuesday: 3,
            Wednesday: 4,
            Thursday: 6,
            Friday: 8,
            Saturday: 12,
            Sunday: 10
          },
          watchCountByHour: {
            '19': 3,
            '20': 10,
            '21': 8,
            '22': 5
          },
          averageTimeBetweenEpisodes: 120
        }
      };

      mockImplementations.getAllStats.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockStats);
      });

      const response = await request(app)
        .get(`/statistics/${mockId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockStats);
    });
  });

  describe('GET /:userId/content-types', () => {
    it('should return content type distribution for a user', async () => {
      const mockContentTypeDistribution = {
        movie: { count: 5, percentage: 20 },
        series: { count: 20, percentage: 80 }
      };

      mockImplementations.getContentTypeDistribution.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockContentTypeDistribution);
      });

      const response = await request(app)
        .get(`/statistics/${mockId}/content-types`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockContentTypeDistribution);
    });
  });

  describe('GET /:userId/series-progress', () => {
    it('should return series progress stats for a user', async () => {
      const mockSeriesProgressStats = {
        completedSeries: 2,
        inProgressSeries: 3,
        averageCompletionPercentage: 65
      };

      mockImplementations.getSeriesProgressStats.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockSeriesProgressStats);
      });

      const response = await request(app)
        .get(`/statistics/${mockId}/series-progress`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockSeriesProgressStats);
    });
  });

  describe('GET /:userId/watching-patterns', () => {
    it('should return watching patterns for a user', async () => {
      const mockWatchingPatterns = {
        mostActiveDay: 'Saturday',
        mostActiveHour: 20,
        mostActiveDate: '2023-06-15',
        watchCountByDay: {
          Monday: 5,
          Tuesday: 3,
          Wednesday: 4,
          Thursday: 6,
          Friday: 8,
          Saturday: 12,
          Sunday: 10
        },
        watchCountByHour: {
          '19': 3,
          '20': 10,
          '21': 8,
          '22': 5
        },
        averageTimeBetweenEpisodes: 120
      };

      mockImplementations.getWatchingPatterns.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockWatchingPatterns);
      });

      const response = await request(app)
        .get(`/statistics/${mockId}/watching-patterns`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockWatchingPatterns);
    });
  });

  describe('GET /:userId/genre-preferences', () => {
    it('should return genre preferences for a user', async () => {
      const mockGenrePreferences = {
        topGenres: [
          { name: 'Action', count: 10 },
          { name: 'Comedy', count: 8 }
        ],
        percentageByGenre: {
          Action: 40,
          Comedy: 32,
          Drama: 28
        }
      };

      mockImplementations.getGenrePreferences.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockGenrePreferences);
      });

      const response = await request(app)
        .get(`/statistics/${mockId}/genre-preferences`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockGenrePreferences);
    });
  });
}); 
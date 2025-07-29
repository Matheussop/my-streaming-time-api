import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../constants/httpStatus';
import { Messages } from '../../constants/messages';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/__tests__/generateValidObjectId';

const mockImplementations = {
  getUserStreamingHistory: jest.fn(),
  addStreamingToHistory: jest.fn(),
  removeStreamingFromHistory: jest.fn(),
  calculateTotalWatchTime: jest.fn(),
  getByUserIdAndStreamingId: jest.fn(),
  addEpisodeToHistory: jest.fn(),
  removeEpisodeFromHistory: jest.fn(),
  getEpisodesWatched: jest.fn(),
  markSeasonAsWatched: jest.fn(),
  unMarkSeasonAsWatched: jest.fn()
};

jest.mock('../../controllers/userStreamingHistoryController', () => ({
  UserStreamingHistoryController: jest.fn().mockImplementation(() => mockImplementations),
}));

jest.mock('../../middleware/validationMiddleware', () => ({
  validate: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

jest.mock('../../middleware/objectIdValidationMiddleware', () => ({
  validateObjectId: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => {
    req.validatedIds = req.validatedIds || {};
    const key = Object.keys(req.params)[0] || 'userId';
    const id = req.params[key] || req.query[key] || '507f1f77bcf86cd799439011';
    req.validatedIds[key] = new Types.ObjectId(id as string);
    next();
  }),
}));

jest.mock('../../services/userStreamingHistoryService', () => ({
  UserStreamingHistoryService: jest.fn().mockImplementation(() => ({})),
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

import router from '../userStreamingHistoryRoutes';

describe('User Streaming History Routes', () => {
  let app: express.Application;
  let mockUserId: string | Types.ObjectId;
  let mockContentId: string | Types.ObjectId;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/streaming-history', router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = generateValidObjectId();
    mockContentId = generateValidObjectId();
  });

  describe('GET /get-episodes-watched', () => {
    it('should return episodes watched by user', async () => {
      const mockEpisodesWatched = {
        seriesId: mockContentId.toString(),
        title: 'Test Series',
        episodesWatched: [
          { 
            episodeId: generateValidObjectId().toString(),
            seasonNumber: 1,
            episodeNumber: 1,
            title: 'Pilot',
            watchedDurationInMinutes: 45,
            watchedAt: new Date().toISOString()
          },
          { 
            episodeId: generateValidObjectId().toString(),
            seasonNumber: 1,
            episodeNumber: 2,
            title: 'Episode 2',
            watchedDurationInMinutes: 42,
            watchedAt: new Date().toISOString()
          }
        ]
      };

      mockImplementations.getEpisodesWatched.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockEpisodesWatched);
      });

      const response = await request(app)
        .get('/streaming-history/get-episodes-watched')
        .query({ 
          userId: mockUserId.toString(),
          contentId: mockContentId.toString()
        })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockEpisodesWatched);
    });
  });

  describe('GET /:userId', () => {
    it('should return user streaming history', async () => {
      const mockStreamingHistory = {
        userId: mockUserId.toString(),
        watchHistory: [
          {
            _id: generateValidObjectId().toString(),
            contentId: generateValidObjectId().toString(),
            contentType: 'movie',
            title: 'Test Movie',
            watchedDurationInMinutes: 120,
            watchedAt: new Date().toISOString()
          },
          {
            _id: generateValidObjectId().toString(),
            contentId: generateValidObjectId().toString(),
            contentType: 'series',
            title: 'Test Series',
            watchedDurationInMinutes: 45,
            watchedAt: new Date().toISOString()
          }
        ],
        totalWatchTimeInMinutes: 165
      };

      mockImplementations.getUserStreamingHistory.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockStreamingHistory);
      });

      const response = await request(app)
        .get(`/streaming-history/${mockUserId}`)
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockStreamingHistory);
    });
  });

  describe('POST /', () => {
    it('should add streaming entry to history', async () => {
      const newStreamingEntry = {
        userId: mockUserId.toString(),
        contentId: mockContentId.toString(),
        contentType: 'movie',
        title: 'New Movie',
        durationInMinutes: 120
      };

      const mockResponse = {
        _id: generateValidObjectId().toString(),
        ...newStreamingEntry,
        watchedAt: new Date().toISOString()
      };

      mockImplementations.addStreamingToHistory.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.CREATED).json(mockResponse);
      });

      const response = await request(app)
        .post('/streaming-history')
        .send(newStreamingEntry)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject(expect.objectContaining(newStreamingEntry));
    });
  });

  describe('DELETE /remove-entry', () => {
    it('should remove streaming entry from history', async () => {
      const deleteRequest = {
        userId: mockUserId.toString(),
        contentId: mockContentId.toString()
      };

      mockImplementations.removeStreamingFromHistory.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ message: 'Streaming entry removed successfully' });
      });

      const response = await request(app)
        .delete('/streaming-history/remove-entry')
        .query(deleteRequest)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ message: 'Streaming entry removed successfully' });
    });
  });

  describe('DELETE /remove-episode', () => {
    it('should remove episode from history', async () => {
      const episodeId = generateValidObjectId();
      const deleteRequest = {
        userId: mockUserId.toString(),
        contentId: mockContentId.toString(),
        episodeId: episodeId.toString()
      };

      mockImplementations.removeEpisodeFromHistory.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ message: 'Episode removed successfully' });
      });

      const response = await request(app)
        .delete('/streaming-history/remove-episode')
        .query(deleteRequest)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ message: 'Episode removed successfully' });
    });
  });

  describe('GET /', () => {
    it('should get streaming history by userId and contentId', async () => {
      const queryParams = {
        userId: mockUserId.toString(),
        contentId: mockContentId.toString()
      };

      const mockHistoryEntry = {
        _id: generateValidObjectId().toString(),
        userId: mockUserId.toString(),
        contentId: mockContentId.toString(),
        contentType: 'movie',
        title: 'Test Movie',
        watchedDurationInMinutes: 120,
        watchedAt: new Date().toISOString()
      };

      mockImplementations.getByUserIdAndStreamingId.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockHistoryEntry);
      });

      const response = await request(app)
        .get('/streaming-history')
        .query(queryParams)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockHistoryEntry);
    });
  });

  describe('POST /add-episode', () => {
    it('should add episode to history', async () => {
      const episodeData = {
        userId: mockUserId.toString(),
        contentId: mockContentId.toString(),
        episodeData: {
          episodeId: generateValidObjectId().toString(),
          seasonNumber: 1,
          episodeNumber: 3,
          title: 'New Episode',
          durationInMinutes: 45
        }
      };

      mockImplementations.addEpisodeToHistory.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.CREATED).json({ 
          message: 'Episode added to history successfully',
          episode: episodeData.episodeData
        });
      });

      const response = await request(app)
        .post('/streaming-history/add-episode')
        .send(episodeData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('message', 'Episode added to history successfully');
      expect(response.body).toHaveProperty('episode');
    });
  });

  describe('POST /mark-season-watched', () => {
    it('should mark season as watched', async () => {
      const payload = {
        userId: mockUserId.toString(),
        contentId: mockContentId.toString(),
        seasonNumber: 1,
      };

      mockImplementations.markSeasonAsWatched.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ message: 'Season marked as watched' });
      });

      const response = await request(app)
        .post('/streaming-history/mark-season-watched')
        .send(payload)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ message: 'Season marked as watched' });
    });
  });

  describe('GET /total-watch-time/:userId', () => {
    it('should return total watch time for user', async () => {
      const mockTotalWatchTime = {
        totalWatchTimeInMinutes: 325,
        userId: mockUserId.toString()
      };

      mockImplementations.calculateTotalWatchTime.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockTotalWatchTime);
      });

      const response = await request(app)
        .get(`/streaming-history/total-watch-time/${mockUserId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockTotalWatchTime);
    });
  });
});

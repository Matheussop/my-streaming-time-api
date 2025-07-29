import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../constants/httpStatus';
import { Messages } from '../../constants/messages';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/__tests__/generateValidObjectId';

const mockImplementations = {
  getSeasons: jest.fn(),
  getSeasonById: jest.fn(),
  getSeasonsBySeriesId: jest.fn(),
  getEpisodesBySeasonNumber: jest.fn(),
  createSeason: jest.fn(),
  updateSeason: jest.fn(),
  deleteSeason: jest.fn(),
};

jest.mock('../../controllers/seasonController', () => ({
  SeasonController: jest.fn().mockImplementation(() => mockImplementations),
}));

jest.mock('../../middleware/validationMiddleware', () => ({
  validate: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

jest.mock('../../middleware/objectIdValidationMiddleware', () => ({
  validateObjectId: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => {
    req.validatedIds = req.validatedIds || {};
    const id = req.params.id || req.params.seriesId || '507f1f77bcf86cd799439011';
    req.validatedIds.id = new Types.ObjectId(id);
    req.validatedIds.seriesId = new Types.ObjectId(req.params.seriesId || id);
    next();
  }),
}));

jest.mock('cron', () => {
  return {
    CronJob: jest.fn().mockImplementation(() => {
      return {
        start: jest.fn(),
        stop: jest.fn(),
      };
    }),
  };
});

import router from '../seasonRoutes';

describe('Season Routes', () => {
  let app: express.Application;
  let mockId: string | Types.ObjectId;
  let mockSeriesId: string | Types.ObjectId;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/seasons', router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockId = generateValidObjectId();
    mockSeriesId = generateValidObjectId();
  });

  describe('GET /', () => {
    it('should return a list of seasons with pagination', async () => {
      const mockSeasons = [
        { 
          _id: mockId.toString(), 
          seriesId: mockSeriesId.toString(),
          seasonNumber: 1,
          title: 'Season 1',
          plot: 'Test plot 1',
          releaseDate: '2024-01-01',
          poster: 'poster1.jpg',
          episodes: [],
          episodeCount: 10
        },
        { 
          _id: generateValidObjectId().toString(), 
          seriesId: mockSeriesId.toString(),
          seasonNumber: 2,
          title: 'Season 2',
          plot: 'Test plot 2',
          releaseDate: '2024-02-01',
          poster: 'poster2.jpg',
          episodes: [],
          episodeCount: 12
        },
      ];

      mockImplementations.getSeasons.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockSeasons);
      });

      const response = await request(app)
        .get('/seasons')
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockSeasons);
    });
  });

  describe('GET /:id', () => {
    it('should return a season by ID', async () => {
      const mockSeason = { 
        _id: mockId.toString(), 
        seriesId: mockSeriesId.toString(),
        seasonNumber: 1,
        title: 'Season 1',
        plot: 'Test plot',
        releaseDate: '2024-01-01',
        poster: 'poster.jpg',
        episodes: [],
        episodeCount: 10
      };

      mockImplementations.getSeasonById.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockSeason);
      });

      const response = await request(app)
        .get(`/seasons/${mockId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockSeason);
    });
  });

  describe('GET /series/:seriesId', () => {
    it('should return seasons by series ID', async () => {
      const mockSeasons = [
        { 
          _id: mockId.toString(), 
          seriesId: mockSeriesId.toString(),
          seasonNumber: 1,
          title: 'Season 1',
          plot: 'Test plot 1',
          releaseDate: '2024-01-01',
          poster: 'poster1.jpg',
          episodes: [],
          episodeCount: 10
        }
      ];

      mockImplementations.getSeasonsBySeriesId.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockSeasons);
      });

      const response = await request(app)
        .get(`/seasons/series/${mockSeriesId}`)
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockSeasons);
    });
  });

  describe('GET /episodes/:seriesId/:seasonNumber', () => {
    it('should return episodes by season number', async () => {
      const mockEpisodes = [
        { 
          episodeNumber: 1,
          title: 'Episode 1',
          plot: 'Episode plot 1',
          durationInMinutes: 45,
          releaseDate: '2024-01-01',
          poster: 'episode1.jpg'
        },
        { 
          episodeNumber: 2,
          title: 'Episode 2',
          plot: 'Episode plot 2',
          durationInMinutes: 42,
          releaseDate: '2024-01-08',
          poster: 'episode2.jpg'
        }
      ];

      mockImplementations.getEpisodesBySeasonNumber.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockEpisodes);
      });

      const response = await request(app)
        .get(`/seasons/episodes/${mockSeriesId}/1`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockEpisodes);
    });

    it('should return 404 if episodes not found', async () => {
      mockImplementations.getEpisodesBySeasonNumber.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.NOT_FOUND).json({ message: 'Episodes not found' });
      });

      const response = await request(app)
        .get(`/seasons/episodes/${mockSeriesId}/999`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toEqual({ message: 'Episodes not found' });
    });
  });

  describe('POST /', () => {
    it('should create a new season', async () => {
      const newSeason = {
        seriesId: mockSeriesId.toString(),
        seasonNumber: 1,
        title: 'New Season',
        plot: 'New plot',
        releaseDate: '2024-01-01',
        poster: 'https://example.com/poster.jpg',
        tmdbId: 12345
      };

      mockImplementations.createSeason.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.CREATED).json({ _id: mockId.toString(), ...newSeason, episodes: [], episodeCount: 0 });
      });

      const response = await request(app)
        .post('/seasons')
        .send(newSeason)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({ 
        _id: mockId.toString(), 
        ...newSeason, 
        episodes: [], 
        episodeCount: 0 
      });
    });
  });

  describe('PUT /:id', () => {
    it('should update a season', async () => {
      const updateData = {
        title: 'Updated Season',
        plot: 'Updated plot',
        releaseDate: '2024-02-01',
        poster: 'https://example.com/updated-poster.jpg'
      };

      mockImplementations.updateSeason.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ 
          _id: mockId.toString(), 
          seriesId: mockSeriesId.toString(),
          seasonNumber: 1,
          ...updateData,
          episodes: [],
          episodeCount: 0,
          tmdbId: 12345
        });
      });

      const response = await request(app)
        .put(`/seasons/${mockId}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ 
        _id: mockId.toString(), 
        seriesId: mockSeriesId.toString(),
        seasonNumber: 1,
        ...updateData,
        episodes: [],
        episodeCount: 0,
        tmdbId: 12345
      });
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a season', async () => {
      const deletedSeason = { 
        _id: mockId.toString(), 
        seriesId: mockSeriesId.toString(),
        seasonNumber: 1,
        title: 'Season 1',
        plot: 'Test plot',
        releaseDate: '2024-01-01',
        poster: 'poster.jpg',
        episodes: [],
        episodeCount: 10
      };

      mockImplementations.deleteSeason.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(deletedSeason);
      });

      const response = await request(app)
        .delete(`/seasons/${mockId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(deletedSeason);
    });
  });
}); 
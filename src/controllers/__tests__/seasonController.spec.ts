import { NextFunction, Request, Response } from 'express';
import { SeasonController } from '../seasonController';
import { SeasonService } from '../../services/seasonService';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/test/generateValidObjectId';
import { ISeasonResponse } from '../../interfaces/series/season';
import { SeasonRepository } from '../../repositories/seasonRepository';
import { TMDBService } from '../../services/tmdbService';

jest.mock('../../services/seasonService');

describe('SeasonController', () => {
  let controller: SeasonController;
  let mockService: jest.Mocked<SeasonService>;
  let mockTMDBService: jest.Mocked<TMDBService>;
  let mockSeasonRepository: jest.Mocked<SeasonRepository>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let validId: Types.ObjectId;
  let mockSeason: ISeasonResponse;

  beforeEach(() => {
    validId = new Types.ObjectId(generateValidObjectId());
    mockSeason = {
      _id: validId.toString(),
      seriesId: validId,
      seasonNumber: 1,
      tmdbId: 12345,
      title: 'Test Season',
      plot: 'Test plot',
      releaseDate: '2024-01-01',
      poster: 'poster-url',
      episodes: [],
      episodeCount: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockSeasonRepository = {} as jest.Mocked<SeasonRepository>;
    mockTMDBService = {} as jest.Mocked<TMDBService>;

    mockService = new SeasonService(mockSeasonRepository, mockTMDBService) as jest.Mocked<SeasonService>;
    controller = new SeasonController(mockService);
    mockReq = {
      body: {},
      params: {},
      validatedIds: {},
      method: 'GET',
      path: '/seasons'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(() => mockRes),
      send: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('getSeasons', () => {
    it('should return seasons with pagination', async () => {
      const page = 1;
      const limit = 10;
      const skip = 0;
      mockReq.body = { page, limit };

      mockService.getSeasons.mockResolvedValue([mockSeason]);

      await controller.getSeasons(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeasons).toHaveBeenCalledWith(skip, limit);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([mockSeason]);
    });

    it('should use default pagination values when not provided', async () => {
      const defaultPage = 1;
      const defaultLimit = 10;
      const defaultSkip = 0;
      mockReq.body = {};

      mockService.getSeasons.mockResolvedValue([mockSeason]);

      await controller.getSeasons(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeasons).toHaveBeenCalledWith(defaultSkip, defaultLimit);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([mockSeason]);
    });
  });

  describe('getSeasonsBySeriesId', () => {
    it('should return seasons for a specific series', async () => {
      const seriesId = validId;
      const limit = 10;
      const skip = 0;
      mockReq.validatedIds = { seriesId };

      mockService.getSeasonsBySeriesId.mockResolvedValue([mockSeason]);

      await controller.getSeasonsBySeriesId(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeasonsBySeriesId).toHaveBeenCalledWith(seriesId, skip, limit);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([mockSeason]);
    });

    it('should return seasons for a specific series with pagination', async () => {
      const seriesId = validId;
      const page = 1;
      const limit = 10;
      const skip = 0;
      
      mockReq.body = { page, limit };
      mockReq.validatedIds = { seriesId };

      mockService.getSeasonsBySeriesId.mockResolvedValue([mockSeason]);

      await controller.getSeasonsBySeriesId(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeasonsBySeriesId).toHaveBeenCalledWith(seriesId, skip, limit);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([mockSeason]);
    });
  });

  describe('getSeasonById', () => {
    it('should return a season by id', async () => {
      const id = validId;
      mockReq.validatedIds = { id };

      mockService.getSeasonById.mockResolvedValue(mockSeason);

      await controller.getSeasonById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeasonById).toHaveBeenCalledWith(id);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockSeason);
    });
  });

  describe('getEpisodesBySeasonNumber', () => {
    it('should return episodes for a specific season', async () => {
      const seriesId = validId;
      const seasonNumber = '1';
      mockReq.validatedIds = { seriesId };
      mockReq.params = { seasonNumber };

      mockService.getEpisodesBySeasonNumber.mockResolvedValue(mockSeason);

      await controller.getEpisodesBySeasonNumber(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getEpisodesBySeasonNumber).toHaveBeenCalledWith(seriesId, Number(seasonNumber));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockSeason);
    });

    it('should return 404 when episodes are not found', async () => {
      const seriesId = validId;
      const seasonNumber = '1';
      mockReq.validatedIds = { seriesId };
      mockReq.params = { seasonNumber };

      mockService.getEpisodesBySeasonNumber.mockResolvedValue(null);

      await controller.getEpisodesBySeasonNumber(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getEpisodesBySeasonNumber).toHaveBeenCalledWith(seriesId, Number(seasonNumber));
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Episodes not found' });
    });
  });

  describe('createSeason', () => {
    it('should create a new season', async () => {
      const seasonData = {
        seriesId: validId,
        seasonNumber: 1,
        tmdbId: 12345,
        title: 'New Season',
        plot: 'New plot',
        releaseDate: '2024-01-01',
        poster: 'poster-url',
        episodes: [],
        episodeCount: 10
      };
      mockReq.body = seasonData;

      mockService.createSeason.mockResolvedValue(mockSeason);

      await controller.createSeason(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.createSeason).toHaveBeenCalledWith(seasonData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockSeason);
    });
  });

  describe('updateSeason', () => {
    it('should update an existing season', async () => {
      const id = validId;
      const updateData = {
        title: 'Updated Season',
        plot: 'Updated plot'
      };
      mockReq.validatedIds = { id };
      mockReq.body = updateData;

      mockService.updateSeason.mockResolvedValue(mockSeason);

      await controller.updateSeason(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.updateSeason).toHaveBeenCalledWith(id, updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockSeason);
    });
  });

  describe('deleteSeason', () => {
    it('should delete a season', async () => {
      const id = validId;
      mockReq.validatedIds = { id };

      mockService.deleteSeason.mockResolvedValue(mockSeason);

      await controller.deleteSeason(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.deleteSeason).toHaveBeenCalledWith(id);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockSeason);
    });
  });
}); 
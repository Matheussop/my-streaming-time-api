import { NextFunction, Request, Response } from 'express';
import { SeriesController } from '../seriesController';
import { SeriesService } from '../../services/seriesService';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/test/generateValidObjectId';
import { ISeriesResponse } from '../../interfaces/series/series';
import { SeriesRepository } from '../../repositories/seriesRepository';
import { TMDBService } from '../../services/tmdbService';
import { SeasonRepository } from '../../repositories/seasonRepository';
import { Messages } from '../../constants/messages';
import { skip } from 'node:test';
import { title } from 'process';

jest.mock('../../services/seriesService');

/**
 * Important to mock catchAsync so that the test is not impacted
 * by the promise that catchAsync returns
 */
jest.mock('../../util/catchAsync', () => ({
  catchAsync: (fn: Function) => fn
}));

describe('SeriesController', () => {
  let controller: SeriesController;
  let mockService: jest.Mocked<SeriesService>;
  let mockTMDBService: jest.Mocked<TMDBService>;
  let mockSeriesRepository: jest.Mocked<SeriesRepository>;
  let mockSeasonRepository: jest.Mocked<SeasonRepository>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let validId: Types.ObjectId;
  let mockSeries: ISeriesResponse;

  beforeEach(() => {
    validId = new Types.ObjectId(generateValidObjectId());
    mockSeries = {
      _id: validId,
      title: 'Test Series',
      plot: 'Test plot',
      releaseDate: '2024-01-01',
      poster: 'poster-url',
      genre: [],
      cast: ['Actor 1'],
      rating: 8.5,
      url: 'series-url',
      videoUrl: 'video-url',
      totalEpisodes: 10,
      totalSeasons: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      tmdbId: 1234567890
    };

    mockSeriesRepository = {} as jest.Mocked<SeriesRepository>;
    mockSeasonRepository = {} as jest.Mocked<SeasonRepository>;
    mockTMDBService = {} as jest.Mocked<TMDBService>;

    mockService = new SeriesService(mockSeriesRepository, mockSeasonRepository, mockTMDBService) as jest.Mocked<SeriesService>;
    controller = new SeriesController(mockService);
    mockReq = {
      body: {},
      params: {},
      validatedIds: {},
      method: 'GET',
      path: '/series'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(() => mockRes),
      send: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    process.env.TMDB_Bearer_Token = 'valid-token';
  });

  describe('getSeries', () => {
    it('should return series with pagination', async () => {
      const page = 1;
      const limit = 10;
      const skip = 0;
      mockReq.query = { page, limit } as any;

      mockService.getSeries.mockResolvedValue([mockSeries]);

      await controller.getSeries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeries).toHaveBeenCalledWith(skip, limit);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([mockSeries]);
    });

    it('should use default pagination values when not provided', async () => {
      const defaultPage = 1;
      const defaultLimit = 10;
      const defaultSkip = 0;
      mockReq.query = {};

      mockService.getSeries.mockResolvedValue([mockSeries]);

      await controller.getSeries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeries).toHaveBeenCalledWith(defaultSkip, defaultLimit);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([mockSeries]);
    });
  });

  describe('getSeriesByTitle', () => {
    it('should return series filtered by title with pagination', async () => {
      const title = 'Test';
      const page = 1;
      const limit = 10;
      const skip = 0;
      mockReq.body = { title, page, limit };

      mockService.getSeriesByTitle.mockResolvedValue([mockSeries]);

      await controller.getSeriesByTitle(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeriesByTitle).toHaveBeenCalledWith(title, skip, limit);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([mockSeries]);
    });

    it('should return series filtered by title ', async () => {
      const title = 'Test';
      const limit = 10;
      const skip = 0;
      mockReq.body = { title };
      mockService.getSeriesByTitle.mockResolvedValue([mockSeries]);

      await controller.getSeriesByTitle(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeriesByTitle).toHaveBeenCalledWith(title, skip, limit);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([mockSeries]);
    });
  });

  describe('getSeriesByGenre', () => {
    it('should return series filtered by genre with pagination', async () => {
      const genre = 'Action';
      const page = 1;
      const limit = 10;
      const skip = 0;
      mockReq.body = { genre, page, limit };

      mockService.getSeriesByGenre.mockResolvedValue([mockSeries]);

      await controller.getSeriesByGenre(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeriesByGenre).toHaveBeenCalledWith(genre, skip, limit);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([mockSeries]);
    });

    it('should return series filtered by genre', async () => {
      const genre = 'Action';
      const limit = 10;
      const skip = 0;
      mockReq.body = { genre };
      mockService.getSeriesByGenre.mockResolvedValue([mockSeries]);

      await controller.getSeriesByGenre(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeriesByGenre).toHaveBeenCalledWith(genre, skip, limit);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([mockSeries]);
    });
  });

  describe('getSerieById', () => {
    it('should return a series by id', async () => {
      const id = validId;
      mockReq.validatedIds = { id };

      mockService.getSeriesById.mockResolvedValue(mockSeries);

      await controller.getSerieById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeriesById).toHaveBeenCalledWith(id);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockSeries);
    });
  });

  describe('createSeries', () => {
    it('should create a new series', async () => {
      const seriesData = {
        title: 'New Series',
        plot: 'New plot',
        releaseDate: '2024-01-01',
        poster: 'poster-url',
        genre: [],
        cast: ['Actor 1'],
        rating: 8.5,
        url: 'series-url',
        videoUrl: 'video-url',
        totalEpisodes: 10,
        totalSeasons: 1
      };
      mockReq.body = seriesData;

      mockService.createSerie.mockResolvedValue(mockSeries);

      await controller.createSeries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.createSerie).toHaveBeenCalledWith(seriesData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockSeries);
    });
  });

  describe('createManySeries', () => {
    it('should create multiple series', async () => {
      const seriesArray = [{
        title: 'New Series 1',
        plot: 'New plot 1',
        releaseDate: '2024-01-01',
        poster: 'poster-url-1',
        genre: [],
        cast: ['Actor 1'],
        rating: 8.5,
        url: 'series-url-1',
        videoUrl: 'video-url-1',
        totalEpisodes: 10,
        totalSeasons: 1
      }, {
        title: 'New Series 2',
        plot: 'New plot 2',
        releaseDate: '2024-01-02',
        poster: 'poster-url-2',
        genre: [],
        cast: ['Actor 2'],
        rating: 9.0,
        url: 'series-url-2',
        videoUrl: 'video-url-2',
        totalEpisodes: 12,
        totalSeasons: 2
      }];
      mockReq.body = { series: seriesArray };

      mockService.createManySeries.mockResolvedValue([mockSeries]);

      await controller.createManySeries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.createManySeries).toHaveBeenCalledWith(seriesArray, false);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith([mockSeries]);
    });
  });

  describe('updateSerie', () => {
    it('should update an existing series', async () => {
      const id = validId;
      const updateData = {
        title: 'Updated Series',
        plot: 'Updated plot'
      };
      mockReq.validatedIds = { id };
      mockReq.body = updateData;

      mockService.updateSerie.mockResolvedValue(mockSeries);

      await controller.updateSerie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.updateSerie).toHaveBeenCalledWith(id, updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockSeries);
    });
  });

  describe('deleteSerie', () => {
    it('should delete a series', async () => {
      const id = validId;
      mockReq.validatedIds = { id };

      mockService.deleteSerie.mockResolvedValue(mockSeries);

      await controller.deleteSerie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.deleteSerie).toHaveBeenCalledWith(id);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: Messages.SERIE_DELETED_SUCCESSFULLY });
    });
  });

  describe('findOrAddSerie', () => {
    process.env.TMDB_Bearer_Token = 'valid-token';
    const page = 1;
    const limit = 10;
    const skip = 0;

    let mockResponse = {
      data: {
        results: [{
          name: 'New Series',
          id: 1234567890,
          first_air_date: '2024-01-01',
          overview: 'New plot',
          poster_path: 'poster-url',
          backdrop_path: 'backdrop-url',
          vote_average: 8.5,
          genre_ids: [1, 2],
          origin_country: ['US'],
          original_language: 'en',
          original_name: 'New Series',
          number_of_episodes: 10,
          number_of_seasons: 1,
          tmdbId: 1234567890
        }]
      }
    };
    it('should find existing series in database without pagination', async () => {
      const title = 'Test Series';
      mockReq.body = { title };

      mockService.getSeriesByTitle.mockResolvedValue([mockSeries]);

      await controller.findOrAddSerie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeriesByTitle).toHaveBeenCalledWith(title, skip, limit);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        page,
        limit,
        total: 1,
        series: [mockSeries],
        hasMore: false
      });
    });

    it('should find existing series in database with pagination', async () => {
      const title = 'Test Series';
      mockReq.body = { title, page, limit };

      mockService.getSeriesByTitle.mockResolvedValue([mockSeries]);

      await controller.findOrAddSerie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeriesByTitle).toHaveBeenCalledWith(title, skip, limit);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        page,
        limit,
        total: 1,
        series: [mockSeries],
        hasMore: false
      });
    });

    it('should add new series from external API if not found in database', async () => {
      const title = 'New Series';
      mockReq.body = { title };

      mockService.getSeriesByTitle.mockResolvedValueOnce([]);
      mockService.getSeriesByTMDBId.mockResolvedValue([]);
      jest.spyOn(require('axios'), 'get').mockResolvedValue(mockResponse);
      mockService.createManySeries.mockResolvedValue([mockSeries]);
      mockService.getSeriesByTitle.mockResolvedValueOnce([mockSeries]);

      await controller.findOrAddSerie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeriesByTitle).toHaveBeenCalledWith(title, 0, limit);
      expect(mockService.createManySeries).toHaveBeenCalled();

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        page,
        limit,
        total: 1,
        series: [mockSeries],
        hasMore: false
      });
    });

    it('should add new series from external API if database return null', async () => {
      const title = 'New Series';
      mockReq.body = { title };

      mockService.getSeriesByTitle.mockResolvedValueOnce(null);
      mockService.getSeriesByTMDBId.mockResolvedValue(null);
      jest.spyOn(require('axios'), 'get').mockResolvedValue(mockResponse);
      mockService.createManySeries.mockResolvedValue([mockSeries]);
      mockService.getSeriesByTitle.mockResolvedValueOnce([mockSeries]);

      await controller.findOrAddSerie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeriesByTitle).toHaveBeenCalledWith(title, 0, limit);
      expect(mockService.createManySeries).toHaveBeenCalled();

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        page,
        limit,
        total: 1,
        series: [mockSeries],
        hasMore: false
      });
    });

    it('should be able to add new series without some attributes from external API if database return null', async () => {
      const title = 'New Series';
      mockReq.body = { title };
      const mockSeriesWithoutAttributes = {
        data: {
          results: [{
            name: 'New Series',
            id: 1234567890,
            first_air_date: '2024-01-01',
            overview: 'New plot',
          }]
        }
      };
      mockService.getSeriesByTitle.mockResolvedValueOnce(null);
      mockService.getSeriesByTMDBId.mockResolvedValue(null);
      jest.spyOn(require('axios'), 'get').mockResolvedValue(mockSeriesWithoutAttributes);
      mockService.createManySeries.mockResolvedValue([mockSeries]);
      mockService.getSeriesByTitle.mockResolvedValueOnce([mockSeries]);

      await controller.findOrAddSerie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeriesByTitle).toHaveBeenCalledWith(title, 0, limit);
      expect(mockService.createManySeries).toHaveBeenCalled();

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        page,
        limit,
        total: 1,
        series: [mockSeries],
        hasMore: false
      });
    });

    it('should be able to return series from database if external API return empty array', async () => {
      const title = 'New Series';
      mockReq.body = { title };
      const mockResponseEmpty = {
        data: {
          results: []
        }
      };
      mockService.getSeriesByTitle.mockResolvedValueOnce([]);
      mockService.getSeriesByTMDBId.mockResolvedValue([mockSeries]);
      jest.spyOn(require('axios'), 'get').mockResolvedValue(mockResponseEmpty);
      mockService.createManySeries.mockResolvedValue([mockSeries]);
      await controller.findOrAddSerie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeriesByTitle).toHaveBeenCalledWith(title, 0, limit);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        page,
        limit,
        total: 0,
        series: [],
        hasMore: false
      });
    });

    it('should be able to return a empty array if database and external API return same tmdbId', async () => {
      const title = 'New Series';
      mockReq.body = { title };

      mockResponse.data.results[0].id = mockSeries.tmdbId!; // Add non-null assertion since we know tmdbId exists
      mockService.getSeriesByTitle.mockResolvedValueOnce(null);
      mockService.getSeriesByTMDBId.mockResolvedValue([mockSeries]);
      jest.spyOn(require('axios'), 'get').mockResolvedValue(mockResponse);
      mockService.createManySeries.mockResolvedValue([mockSeries]);
      mockService.getSeriesByTitle.mockResolvedValueOnce(null);

      await controller.findOrAddSerie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeriesByTitle).toHaveBeenCalledWith(title, 0, limit);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        page,
        limit,
        total: 0,
        series: [],
        hasMore: false
      });
    });

    it('should be able to return a empty array if createManySeries fails', async () => {
      const title = 'New Series';
      mockReq.body = { title };

      mockResponse.data.results[0].id = mockSeries.tmdbId!; // Add non-null assertion since we know tmdbId exists
      mockService.getSeriesByTitle.mockResolvedValueOnce(null);
      mockService.getSeriesByTMDBId.mockResolvedValue([mockSeries]);
      jest.spyOn(require('axios'), 'get').mockResolvedValue(mockResponse);
      mockService.createManySeries.mockResolvedValue([mockSeries]);
      mockService.getSeriesByTitle.mockResolvedValueOnce(null);

      await controller.findOrAddSerie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeriesByTitle).toHaveBeenCalledWith(title, 0, limit);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        page,
        limit,
        total: 0,
        series: [],
        hasMore: false
      });
    });

    it('should be able to return a empty array if external API return error', async () => {
      const title = 'New Series';
      mockReq.body = { title };

      mockResponse.data.results[0].id = mockSeries.tmdbId!; // Add non-null assertion since we know tmdbId exists
      mockService.getSeriesByTitle.mockResolvedValueOnce([]);
      mockService.getSeriesByTMDBId.mockResolvedValue([mockSeries]);
      process.env.TMDB_Bearer_Token = ''; 
      jest.spyOn(require('axios'), 'get').mockRejectedValue(mockResponse);
      mockService.createManySeries.mockResolvedValue([mockSeries]);
      mockService.getSeriesByTitle.mockResolvedValueOnce(null);

      await controller.findOrAddSerie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeriesByTitle).toHaveBeenCalledWith(title, 0, limit);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        page,
        limit,
        total: 0,
        series: [],
        hasMore: false
      });
    });

    it('should be able to return a updated series if database return null', async () => {
      const title = 'New Series';
      mockReq.body = { title };

      mockService.getSeriesByTitle.mockResolvedValueOnce([]);
      mockService.getSeriesByTMDBId.mockResolvedValue([]);
      jest.spyOn(require('axios'), 'get').mockResolvedValue(mockResponse);
      mockService.createManySeries.mockResolvedValue([mockSeries]);
      mockService.getSeriesByTitle.mockResolvedValueOnce(null);

      await controller.findOrAddSerie(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getSeriesByTitle).toHaveBeenCalledWith(title, 0, limit);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        page,
        limit,
        total: 0,
        series: [],
        hasMore: false
      });
    });
  });

  describe('fetchAndSaveExternalSeries', () => {
    it('should fetch and save series from external API', async () => {
      mockService.fetchAndSaveExternalSeries.mockResolvedValue([mockSeries]);

      await controller.fetchAndSaveExternalSeries(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.fetchAndSaveExternalSeries).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith([mockSeries]);
    });
  });
}); 
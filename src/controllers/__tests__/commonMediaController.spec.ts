import { NextFunction, Request, Response } from 'express';
import { CommonMediaController } from '../commonMediaController';
import { ContentService } from '../../services/commonService';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/test/generateValidObjectId';
import { ContentRepository } from '../../repositories/contentRepository';

jest.mock('../../services/commonService');
jest.mock('../../repositories/contentRepository');

describe('CommonMediaController', () => {
  let controller: CommonMediaController;
  let mockService: jest.Mocked<ContentService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let validId: Types.ObjectId | string;
  let mockMedia: any;

  beforeEach(() => {
    validId = generateValidObjectId();
    mockMedia = {
      _id: validId as Types.ObjectId,
      title: 'Test Media',
      genre: ['Action', 'Adventure'],
      durationTime: 120,
      releaseDate: '2024-01-01',
      plot: 'Test plot',
      cast: ['Actor 1'],
      rating: 8.5,
      poster: 'poster-url',
      url: 'media-url',
      videoUrl: 'video-url',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockRepository = new ContentRepository() as jest.Mocked<ContentRepository>;
    mockService = new ContentService(mockRepository) as jest.Mocked<ContentService>;
    controller = new CommonMediaController(mockService);
    mockReq = {
      body: {},
      query: {},
      method: 'GET',
      path: '/common-media'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(() => mockRes),
      send: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('getCommonMediaList', () => {
    it('should return paginated common media list', async () => {
      const validSecondaryId = new Types.ObjectId();
      const paginatedMedia = [
        mockMedia,
        { ...mockMedia, _id: validSecondaryId, title: 'Media 2' }
      ];
      mockReq.query = { page: '1', limit: '10' };
      mockService.getContentList.mockResolvedValue(paginatedMedia);

      await controller.getCommonMediaList(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getContentList).toHaveBeenCalledWith(0, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(paginatedMedia);
    });

    it('should use default pagination values when not provided', async () => {
      const defaultMedia = [mockMedia];
      mockReq.query = {};
      mockService.getContentList.mockResolvedValue(defaultMedia);

      await controller.getCommonMediaList(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getContentList).toHaveBeenCalledWith(0, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(defaultMedia);
    });
  });

  describe('getCommonMediaByGenre', () => {
    it('should return common media filtered by genre', async () => {
      const mediaByGenre = [mockMedia];
      const genre = 'Action';
      mockReq.body = { genre };
      mockService.getContentByGenre.mockResolvedValue(mediaByGenre);

      await controller.getCommonMediaByGenre(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getContentByGenre).toHaveBeenCalledWith(genre, 0, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mediaByGenre);
    });

    it('should return common media filtered by genre with pagination', async () => {
      const mediaByGenre = [mockMedia];
      const genre = 'Action';
      mockReq.body = { genre };
      mockReq.query = { page: '1', limit: '10' };
      mockService.getContentByGenre.mockResolvedValue(mediaByGenre);

      await controller.getCommonMediaByGenre(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getContentByGenre).toHaveBeenCalledWith(genre, 0, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mediaByGenre);
    });
  });
}); 
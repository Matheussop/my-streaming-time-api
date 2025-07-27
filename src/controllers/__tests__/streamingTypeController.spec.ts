import { NextFunction, Request, Response } from 'express';
import { StreamingTypeController } from '../streamingTypeController';
import { StreamingTypeService } from '../../services/streamingTypeService';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/__tests__/generateValidObjectId';
import { StreamingTypeRepository } from '../../repositories/streamingTypeRepository';
import { IStreamingTypeResponse } from '../../interfaces/streamingTypes';
import { Messages } from '../../constants/messages';

jest.mock('../../services/streamingTypeService');

/**
 * Important to mock catchAsync so that the test is not impacted
 * by the promise that catchAsync returns
 */
jest.mock('../../util/catchAsync', () => ({
  catchAsync: (fn: Function) => fn
}));

describe('StreamingTypeController', () => {
  let controller: StreamingTypeController;
  let mockService: jest.Mocked<StreamingTypeService>;
  let mockStreamingTypeRepository: jest.Mocked<StreamingTypeRepository>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let validId: Types.ObjectId;
  let mockStreamingType: IStreamingTypeResponse;

  beforeEach(() => {
    validId = new Types.ObjectId(generateValidObjectId());
    mockStreamingType = {
      _id: validId,
      name: 'Series',
      logo: 'series-logo.png',
      createdAt: new Date(),
      updatedAt: new Date()
    } as unknown as IStreamingTypeResponse;

    mockStreamingTypeRepository = {} as jest.Mocked<StreamingTypeRepository>;
    mockService = new StreamingTypeService(mockStreamingTypeRepository) as jest.Mocked<StreamingTypeService>;
    controller = new StreamingTypeController(mockService);
    mockReq = {
      body: {},
      params: {},
      validatedIds: {},
      method: 'GET',
      path: '/streaming-types'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(() => mockRes),
      send: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('getStreamingTypes', () => {
    it('should return streaming types with pagination', async () => {
      const limit = 10;
      const skip = 0;
      mockReq.query = { page: '1', limit: '10' };

      mockService.getAllStreamingTypes.mockResolvedValue([mockStreamingType]);

      await controller.getStreamingTypes(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getAllStreamingTypes).toHaveBeenCalledWith(skip, limit);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([mockStreamingType]);
    });

    it('should use default pagination values when not provided', async () => {
      const defaultLimit = 10;
      const defaultSkip = 0;
      mockReq.query = {};
      mockService.getAllStreamingTypes.mockResolvedValue([mockStreamingType]);

      await controller.getStreamingTypes(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getAllStreamingTypes).toHaveBeenCalledWith(defaultSkip, defaultLimit);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([mockStreamingType]);
    });
  });

  describe('getStreamingTypeById', () => {
    it('should return a streaming type by id', async () => {
      const id = validId;
      mockReq.validatedIds = { id };

      mockService.getStreamingTypeById.mockResolvedValue(mockStreamingType);

      await controller.getStreamingTypeById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getStreamingTypeById).toHaveBeenCalledWith(id);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockStreamingType);
    });
  });

  describe('createStreamingType', () => {
    it('should create a new streaming type', async () => {
      const streamingTypeData = {
        name: 'New Streaming',
        logo: 'new-logo.png',
        categories: []
      };
      mockReq.body = streamingTypeData;

      mockService.createStreamingType.mockResolvedValue(mockStreamingType);

      await controller.createStreamingType(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.createStreamingType).toHaveBeenCalledWith(streamingTypeData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockStreamingType);
    });

    it('should create a new streaming type without a category', async () => {
      const streamingTypeData = {
        name: 'New Streaming',
        logo: 'new-logo.png',
      };
      mockReq.body = streamingTypeData;

      mockService.createStreamingType.mockResolvedValue(mockStreamingType);

      await controller.createStreamingType(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.createStreamingType).toHaveBeenCalledWith(streamingTypeData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockStreamingType);
    });
  });

  describe('updateStreamingType', () => {
    it('should update an existing streaming type', async () => {
      const id = validId;
      const updateData = {
        name: 'Updated Streaming',
        logo: 'updated-logo.png'
      };
      mockReq.validatedIds = { id };
      mockReq.body = updateData;

      mockService.updateStreamingType.mockResolvedValue(mockStreamingType);

      await controller.updateStreamingType(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.updateStreamingType).toHaveBeenCalledWith(id, updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockStreamingType);
    });
  });

  describe('deleteStreamingType', () => {
    it('should delete a streaming type', async () => {
      const id = validId;
      mockReq.validatedIds = { id };

      mockService.deleteStreamingType.mockResolvedValue(mockStreamingType);

      await controller.deleteStreamingType(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.deleteStreamingType).toHaveBeenCalledWith(id);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalledWith(Messages.STREAMING_TYPE_DELETED_SUCCESSFULLY);
    });
  });

  describe('getStreamingTypeByName', () => {
    it('should return streaming type for valid name', async () => {
      const nameStreamingType = 'Movies';
      const mockStreamingType = { _id: validId, name: nameStreamingType } as IStreamingTypeResponse;
      mockReq = {
        params: { name: nameStreamingType },
        method: 'GET',
        path: '/streaming-types/id',
      };
      mockService.getStreamingTypeByName.mockResolvedValue(mockStreamingType);

      await controller.getStreamingTypeByName(mockReq as Request, mockRes as Response, mockNext);
      expect(mockService.getStreamingTypeByName).toHaveBeenCalledWith(nameStreamingType);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockStreamingType);
    });
  });

  describe('addGenreToStreamingType', () => {
    it('should add genre to streaming type successfully', async () => {
      const genresName = ['Action'];
      const mockUpdatedType = {
        _id: validId,
        categories: [
          { id: 1, name: 'Action' },
          { id: 2, name: 'Drama' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Series'
      } as unknown as IStreamingTypeResponse;
      mockReq = {
        params: { id: validId.toString() },
        validatedIds: { id: validId },
        body: { genres: genresName },
        method: 'POST',
        path: `/streaming-types/${validId}/categories`,
      };
      mockService.addGenreToStreamingType.mockResolvedValue(mockUpdatedType);

      await controller.addGenreToStreamingType(mockReq as Request, mockRes as Response, mockNext);
      expect(mockService.addGenreToStreamingType).toHaveBeenCalledWith(validId, genresName);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUpdatedType);
    });
  });

  describe('deleteGenreFromStreamingTypeByName', () => {
    it('should remove category from streaming type successfully', async () => {
      const categories = [{ id: 1 }];
      const mockDeletedType = { _id: validId, categories: [{ id: 2, name: 'Drama' }] } as unknown as IStreamingTypeResponse;
      mockReq = {
        params: { id: validId.toString() },
        validatedIds: { id: validId },
        body: { genresName: categories },
        method: 'DELETE',
        path: `/streaming-types/${validId}/categories`,
      };
      mockService.deleteGenresFromStreamingTypeByName.mockResolvedValue(mockDeletedType);

      await controller.deleteGenreFromStreamingTypeByName(mockReq as Request, mockRes as Response, mockNext);
      expect(mockService.deleteGenresFromStreamingTypeByName).toHaveBeenCalledWith(validId, categories);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockDeletedType);
    });
  });

  describe('addGenreToStreamingType', () => {
    it('should add a genre to streaming type', async () => {
      const id = validId;
      const genreData = [{
        id: 1,
        name: 'Action'
      }];
      mockReq.validatedIds = { id };
      mockReq.body = {genres: genreData};

      mockService.addGenreToStreamingType.mockResolvedValue(mockStreamingType);

      await controller.addGenreToStreamingType(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.addGenreToStreamingType).toHaveBeenCalledWith(id, genreData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockStreamingType);
    });
  });

  describe('changeCover', () => {
    it('should change the cover of a streaming type', async () => {
      mockReq = {
        path: '/streaming-types/cover',
        method: 'PUT'
      }

      await controller.changeCover(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.changeCover).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: Messages.COVER_CHANGED_SUCCESSFULLY
      }));
    });
  });

  describe('syncStreamingTypesWithGenres', () => {
    it('should sync streaming types with genres', async () => {
      const synchronizedStreamingTypes = { created: 20, updated:20}
      mockService.syncStreamingTypesWithGenres.mockResolvedValue(synchronizedStreamingTypes)
      await controller.syncStreamingTypesWithGenres(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.syncStreamingTypesWithGenres).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: Messages.STREAMING_TYPES_SYNCHRONIZED_COVER_CHANGED_SUCCESSFULLY,
        result: synchronizedStreamingTypes
      });
    });
  });
});

import { NextFunction, Request, Response } from 'express';
import { StreamingTypeController } from '../streamingTypeController';
import { StreamingTypeService } from '../../services/streamingTypeService';
import { generateValidObjectId } from '../../util/test/generateValidObjectId';
import { StreamingTypeRepository } from '../../repositories/streamingTypeRepository';
import logger from '../../config/logger';
import { StreamingServiceError } from '../../middleware/errorHandler';
import { IStreamingTypeCreate, IStreamingTypeResponse, IStreamingTypeUpdate } from '../../interfaces/streamingTypes';
import { ErrorMessages } from '../../constants/errorMessages';
import { Messages } from '../../constants/messages';

jest.mock('../../services/streamingTypeService');

describe('StreamingTypeController', () => {
  let controller: StreamingTypeController;
  let mockService: jest.Mocked<StreamingTypeService>;
  let mockStreamingTypeRepository: jest.Mocked<StreamingTypeRepository>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let validId: string;

  beforeEach(() => {
    validId = generateValidObjectId();
    mockStreamingTypeRepository = {} as jest.Mocked<StreamingTypeRepository>;
    mockService = new StreamingTypeService(mockStreamingTypeRepository) as jest.Mocked<StreamingTypeService>;
    controller = new StreamingTypeController(mockService);

    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('getStreamingTypes', () => {
    it('should return paginated streaming types', async () => {
      const mockStreamingTypes: IStreamingTypeResponse[] = [
        { _id: 1, name: 'Movie' },
        { _id: 2, name: 'Series' },
      ] as unknown as IStreamingTypeResponse[];

      mockReq = {
        query: { page: '1', limit: '10' },
        method: 'GET',
        path: '/streaming-types',
      };
      mockService.getAllStreamingTypes.mockResolvedValue(mockStreamingTypes);

      await controller.getStreamingTypes(mockReq as Request, mockRes as Response, mockNext);
      expect(mockService.getAllStreamingTypes).toHaveBeenCalledWith(0, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockStreamingTypes);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle custom pagination values', async () => {
      mockReq = {
        query: { page: '2', limit: '5' },
        method: 'GET',
        path: '/streaming-types',
      };

      await controller.getStreamingTypes(mockReq as Request, mockRes as Response, mockNext);
      expect(mockService.getAllStreamingTypes).toHaveBeenCalledWith(5, 5);
    });
  });

  describe('getStreamingTypeById', () => {
    it('should return streaming type for valid ID', async () => {
      const mockStreamingType = { _id: validId, name: 'Movie' } as IStreamingTypeResponse;
      mockReq = {
        params: { id: validId },
        method: 'GET',
        path: '/streaming-types/id',
      };
      mockService.getStreamingTypeById.mockResolvedValue(mockStreamingType);

      await controller.getStreamingTypeById(mockReq as Request, mockRes as Response, mockNext);
      expect(mockService.getStreamingTypeById).toHaveBeenCalledWith(validId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockStreamingType);
    });

    it('should throw error for invalid ID format', async () => {
      mockReq = {
        params: { id: 'invalid-id' },
      };

      await controller.getStreamingTypeById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        new StreamingServiceError(ErrorMessages.INVALID_ID_FORMAT('streamingType'), 400),
      );
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

  describe('createStreamingType', () => {
    it('should create new streaming type successfully', async () => {
      const mockStreamingTypeData = {
        name: 'New Type',
        categories: [
          { id: 1, name: 'Action' },
          { id: 2, name: 'Drama' },
        ],
      } as IStreamingTypeCreate;
      const mockCreatedType = { id: '1', ...mockStreamingTypeData };
      mockReq = {
        body: mockStreamingTypeData,
        method: 'POST',
        path: '/streaming-types',
      };
      mockService.createStreamingType.mockResolvedValue(mockCreatedType);

      await controller.createStreamingType(mockReq as Request, mockRes as Response, mockNext);
      expect(mockService.createStreamingType).toHaveBeenCalledWith(mockStreamingTypeData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockCreatedType);
    });
  });

  describe('updateStreamingType', () => {
    it('should update streaming type successfully', async () => {
      const updateData = { name: 'Updated Type' };
      const mockUpdatedType = { id: validId, ...updateData };
      mockReq = {
        params: { id: validId },
        body: updateData,
        method: 'PUT',
        path: `/streaming-types/${validId}`,
      };
      mockService.updateStreamingType.mockResolvedValue(mockUpdatedType);

      await controller.updateStreamingType(mockReq as Request, mockRes as Response, mockNext);
      expect(mockService.updateStreamingType).toHaveBeenCalledWith(validId, updateData);
      expect(mockRes.json).toHaveBeenCalledWith(mockUpdatedType);
    });
  });

  describe('deleteStreamingType', () => {
    it('should delete streaming type successfully', async () => {
      mockReq = {
        params: { id: validId },
        method: 'DELETE',
        path: `/streaming-types/${validId}`,
      };

      await controller.deleteStreamingType(mockReq as Request, mockRes as Response, mockNext);
      expect(mockService.deleteStreamingType).toHaveBeenCalledWith(validId);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalledWith(Messages.STREAMING_TYPE_DELETED_SUCCESSFULLY);
    });
  });

  describe('addCategoryToStreamingType', () => {
    it('should add category to streaming type successfully', async () => {
      const categories = ['Action'];
      const mockUpdatedType = {
        _id: validId,
        categories: [
          { id: 1, name: 'Action' },
          { id: 2, name: 'Drama' },
        ],
      } as IStreamingTypeResponse;
      mockReq = {
        params: { id: validId },
        body: { categories },
        method: 'POST',
        path: `/streaming-types/${validId}/categories`,
      };
      mockService.addCategoryToStreamingType.mockResolvedValue(mockUpdatedType);

      await controller.addCategoryToStreamingType(mockReq as Request, mockRes as Response, mockNext);
      expect(mockService.addCategoryToStreamingType).toHaveBeenCalledWith(validId, categories);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUpdatedType);
    });
  });

  describe('removeCategoryFromStreamingType', () => {
    it('should remove category from streaming type successfully', async () => {
      const categories = [{ id: 1 }];
      const mockUpdatedType = { _id: validId, categories: [{ id: 2, name: 'Drama' }] } as IStreamingTypeResponse;
      mockReq = {
        params: { id: validId },
        body: { categories },
        method: 'DELETE',
        path: `/streaming-types/${validId}/categories`,
      };
      mockService.removeCategoryFromStreamingType.mockResolvedValue(mockUpdatedType);

      await controller.removeCategoryFromStreamingType(mockReq as Request, mockRes as Response, mockNext);
      expect(mockService.removeCategoryFromStreamingType).toHaveBeenCalledWith(validId, categories);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUpdatedType);
    });
  });
});

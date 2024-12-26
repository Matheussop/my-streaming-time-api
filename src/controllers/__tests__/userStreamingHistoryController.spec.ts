import { NextFunction, Request, Response } from 'express';
import { UserStreamingHistoryService } from '../../services/userStreamingHistoryService';
import { StreamingServiceError } from '../../middleware/errorHandler';
import { generateValidObjectId } from '../../util/test/generateValidObjectId';
import { UserStreamingHistoryController } from '../userStreamingHistoryController';
import { IMovieRepository, IUserStreamingHistoryRepository } from '../../interfaces/repositories';
import { IUserStreamingHistory, StreamingHistoryEntry } from '../../models/userStreamingHistoryModel';
import logger from '../../config/logger';

jest.mock('../../services/userStreamingHistoryService');

describe('UserStreamingHistoryController', () => {
  let controller: UserStreamingHistoryController;
  let mockService: jest.Mocked<UserStreamingHistoryService>;
  let mockUserStreamingHistoryRepository: jest.Mocked<IUserStreamingHistoryRepository>;
  let mockMovieRepository: jest.Mocked<IMovieRepository>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let mockHistory: IUserStreamingHistory;
  let validUserId: string;

  beforeAll(() => {
    const streamingHistoryEntry: StreamingHistoryEntry[] = [
      {
        streamingId: generateValidObjectId(),
        title: 'Test Movie 1',
        durationInMinutes: 60,
      },
      {
        streamingId: generateValidObjectId(),
        title: 'Test Movie 2',
        durationInMinutes: 30,
      },
    ];
    mockHistory = {
      userId: validUserId,
      watchHistory: streamingHistoryEntry,
      totalWatchTimeInMinutes: 90,
    } as IUserStreamingHistory;
  });

  beforeEach(() => {
    validUserId = generateValidObjectId();
    mockUserStreamingHistoryRepository = {} as jest.Mocked<IUserStreamingHistoryRepository>;
    mockMovieRepository = {} as jest.Mocked<IMovieRepository>;
    mockService = new UserStreamingHistoryService(
      mockUserStreamingHistoryRepository,
      mockMovieRepository,
    ) as jest.Mocked<UserStreamingHistoryService>;
    controller = new UserStreamingHistoryController(mockService);
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('getUserStreamingHistory', () => {
    it('should successfully fetch user streaming history', async () => {
      mockReq = {
        params: { userId: validUserId },
        method: 'GET',
        path: '/history',
      };
      mockService.getUserHistory.mockResolvedValue(mockHistory);

      await controller.getUserStreamingHistory(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getUserHistory).toHaveBeenCalledWith(validUserId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ history: mockHistory });
      expect(logger.info).toHaveBeenCalled();
    });

    it('should throw error for invalid user ID format', async () => {
      mockReq = {
        params: { userId: 'invalid-id' },
        method: 'GET',
        path: '/history',
      };

      await controller.getUserStreamingHistory(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new StreamingServiceError('Invalid user ID format', 400));
    });
  });

  describe('addStreamingToHistory', () => {
    it('should successfully add streaming to history', async () => {
      const validPayload = {
        userId: validUserId,
        streamingId: generateValidObjectId(),
        title: 'Test Movie 3',
        durationInMinutes: 120,
      };

      mockReq = {
        body: validPayload,
        method: 'POST',
        path: '/history',
      };
      const { userId, ...validPayloadWithoutUserId } = validPayload;
      const mockResult = {
        ...mockHistory,
        watchHistory: [...mockHistory.watchHistory, validPayloadWithoutUserId],
        totalWatchTimeInMinutes: mockHistory.totalWatchTimeInMinutes + validPayload.durationInMinutes,
      } as IUserStreamingHistory;
      mockService.addStreamingToHistory.mockResolvedValue(mockResult);

      await controller.addStreamingToHistory(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.addStreamingToHistory).toHaveBeenCalledWith(validPayload.userId, {
        streamingId: validPayload.streamingId,
        title: validPayload.title,
        durationInMinutes: validPayload.durationInMinutes,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Streaming entry added successfully',
        history: mockResult,
      });
    });

    it('should create a new history if user does not have one', async () => {
      const validPayload = {
        userId: validUserId,
        streamingId: generateValidObjectId(),
        title: 'Test Movie 3',
        durationInMinutes: 120,
      };

      mockReq = {
        body: validPayload,
        method: 'POST',
        path: '/history',
      };
      const { userId, ...validPayloadWithoutUserId } = validPayload;
      const mockResult = { userId, watchHistory: [validPayloadWithoutUserId] } as IUserStreamingHistory;
      mockService.addStreamingToHistory.mockResolvedValue(mockResult);

      await controller.addStreamingToHistory(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.addStreamingToHistory).toHaveBeenCalledWith(validPayload.userId, {
        streamingId: validPayload.streamingId,
        title: validPayload.title,
        durationInMinutes: validPayload.durationInMinutes,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Streaming entry added successfully',
        history: mockResult,
      });
    });

    it('should throw error for missing request body', async () => {
      mockReq = {
        body: {},
        method: 'POST',
        path: '/history',
      };

      await controller.addStreamingToHistory(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new StreamingServiceError('Request body is missing', 400));
    });
  });

  describe('removeStreamingFromHistory', () => {
    it('should successfully remove streaming from history', async () => {
      const validPayload = {
        userId: validUserId,
        streamingId: mockHistory.watchHistory[0].streamingId,
      };
      mockReq = {
        body: validPayload,
        method: 'DELETE',
        path: '/history',
      };

      const mockResult = {
        ...mockHistory,
        watchHistory: mockHistory.watchHistory.filter((entry) => entry.streamingId !== validPayload.streamingId),
        totalWatchTimeInMinutes: mockHistory.totalWatchTimeInMinutes - mockHistory.watchHistory[0].durationInMinutes,
      } as IUserStreamingHistory;
      mockService.removeStreamingFromHistory.mockResolvedValue(mockResult);

      await controller.removeStreamingFromHistory(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.removeStreamingFromHistory).toHaveBeenCalledWith(
        validPayload.userId,
        validPayload.streamingId,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Streaming entry removed successfully',
        history: mockResult,
      });
    });

    it('should throw error for invalid user id', async () => {
      mockReq = {
        body: {
          userId: 'invalid-id',
          streamingId: 'invalid-id',
        },
        method: 'DELETE',
        path: '/history',
      };

      await controller.removeStreamingFromHistory(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new StreamingServiceError('Invalid user ID format', 400));
    });

    it('should throw error for invalid streaming id', async () => {
      mockReq = {
        body: {
          userId: validUserId,
          streamingId: 'invalid-id',
        },
        method: 'DELETE',
        path: '/history',
      };

      await controller.removeStreamingFromHistory(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new StreamingServiceError('Invalid streaming ID format', 400));
    });
  });

  describe('calculateTotalWatchTime', () => {
    it('should successfully calculate total watch time', async () => {
      mockReq = {
        params: { userId: validUserId },
        method: 'GET',
        path: '/history/total-time',
      };
      const mockTotalTime = 90;
      mockService.getTotalWatchTime.mockResolvedValue(mockTotalTime);

      await controller.calculateTotalWatchTime(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getTotalWatchTime).toHaveBeenCalledWith(validUserId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        totalWatchTimeInMinutes: mockTotalTime,
      });
    });

    it('should throw error for invalid user ID', async () => {
      mockReq = {
        params: { userId: 'invalid-id' },
        method: 'GET',
        path: '/history/total-time',
      };

      await controller.calculateTotalWatchTime(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new StreamingServiceError('Invalid user ID format', 400));
    });
  });
});

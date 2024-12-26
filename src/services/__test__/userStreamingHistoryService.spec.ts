import { UserStreamingHistoryService } from '../userStreamingHistoryService';
import { StreamingServiceError } from '../../middleware/errorHandler';
import { IUserStreamingHistory, StreamingHistoryEntry } from '../../models/userStreamingHistoryModel';

describe('UserStreamingHistoryService', () => {
  let service: UserStreamingHistoryService;
  let mockRepository: any;
  let mockMovieRepository: any;

  const mockUserId = 'user123';
  const mockStreamingEntry: StreamingHistoryEntry = {
    streamingId: 'streaming123',
    title: 'Test Movie',
    durationInMinutes: 120,
  };

  const mockHistory: Partial<IUserStreamingHistory> = {
    userId: mockUserId,
    totalWatchTimeInMinutes: 240,
    watchHistory: [
      {
        streamingId: 'other123',
        title: 'Other Movie',
        durationInMinutes: 240,
      },
    ],
  };

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      addToHistory: jest.fn(),
      removeFromHistory: jest.fn(),
    };

    mockMovieRepository = {
      findById: jest.fn(),
    };

    service = new UserStreamingHistoryService(mockRepository, mockMovieRepository);
  });

  describe('getUserHistory', () => {
    it('should return user history when found', async () => {
      mockRepository.findByUserId.mockResolvedValue(mockHistory);

      const result = await service.getUserHistory(mockUserId);

      expect(result).toBe(mockHistory);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw error when user history not found', async () => {
      mockRepository.findByUserId.mockResolvedValue(null);

      await expect(service.getUserHistory(mockUserId)).rejects.toThrow(
        new StreamingServiceError('User history not found', 404),
      );
    });
  });

  describe('addStreamingToHistory', () => {
    it('should add streaming to history successfully', async () => {
      mockMovieRepository.findById.mockResolvedValue({
        _id: mockStreamingEntry.streamingId,
        title: mockStreamingEntry.title,
      });
      mockRepository.findByUserId.mockResolvedValue(mockHistory);
      const mockHistoryWithNewEntry = {
        ...mockHistory,
        watchHistory: [...(mockHistory.watchHistory || []), mockStreamingEntry] as StreamingHistoryEntry[],
      };
      mockRepository.addToHistory.mockResolvedValue(mockHistoryWithNewEntry);

      const result = await service.addStreamingToHistory(mockUserId, mockStreamingEntry);

      expect(result.watchHistory).toContain(mockStreamingEntry);
      expect(mockMovieRepository.findById).toHaveBeenCalledWith(mockStreamingEntry.streamingId);
      expect(mockRepository.addToHistory).toHaveBeenCalledWith(mockUserId, mockStreamingEntry);
    });

    it('should add streaming to empty history successfully', async () => {
      mockMovieRepository.findById.mockResolvedValue({
        _id: mockStreamingEntry.streamingId,
        title: mockStreamingEntry.title,
      });
      const mockStreamingHistoryData = {
        userId: mockUserId,
        watchHistory: [mockStreamingEntry],
      }
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockStreamingHistoryData);

      const result = await service.addStreamingToHistory(mockUserId, mockStreamingEntry);

      expect(result.watchHistory).toContain(mockStreamingEntry);
      expect(mockMovieRepository.findById).toHaveBeenCalledWith(mockStreamingEntry.streamingId);
      expect(mockRepository.create).toHaveBeenCalledWith(mockStreamingHistoryData);
    });

    it('should throw error when streaming not found', async () => {
      mockMovieRepository.findById.mockResolvedValue(null);

      await expect(service.addStreamingToHistory(mockUserId, mockStreamingEntry)).rejects.toThrow(
        new StreamingServiceError('Streaming not found', 404),
      );
    });

    it('should throw error when invalid streaming title', async () => {
      mockMovieRepository.findById.mockResolvedValue({
        _id: mockStreamingEntry.streamingId,
        title: 'Other Movie',
      });

      await expect(service.addStreamingToHistory(mockUserId, mockStreamingEntry)).rejects.toThrow(
        new StreamingServiceError('Invalid streaming title', 400),
      );
    });

    it('should throw error when streaming already exists in history', async () => {
      const existingEntry = { ...mockStreamingEntry };
      mockMovieRepository.findById.mockResolvedValue({
        _id: existingEntry.streamingId,
        title: existingEntry.title,
      });
      mockRepository.findByUserId.mockResolvedValue({
        ...mockHistory,
        watchHistory: [existingEntry],
      });

      await expect(service.addStreamingToHistory(mockUserId, existingEntry)).rejects.toThrow(
        new StreamingServiceError('Streaming already in history', 400),
      );
    });
  });

  describe('removeStreamingFromHistory', () => {
    it('should remove streaming from history successfully', async () => {
      mockRepository.findByUserId.mockResolvedValue(mockHistory);
      mockRepository.removeFromHistory.mockResolvedValue({
        ...mockHistory,
        watchHistory: [],
      });
      const mockStreamingId = mockHistory.watchHistory?.[0]?.streamingId || '';
      const mockDurationInMinutes = mockHistory.watchHistory?.[0]?.durationInMinutes || 0;
      const result = await service.removeStreamingFromHistory(mockUserId, mockStreamingId);

      expect(result?.watchHistory).toHaveLength(0);
      expect(mockRepository.removeFromHistory).toHaveBeenCalledWith(mockUserId, mockStreamingId, mockDurationInMinutes);
    });

    it('should throw error when streaming not found in history', async () => {
      mockRepository.findByUserId.mockResolvedValue(mockHistory);

      await expect(service.removeStreamingFromHistory(mockUserId, 'nonexistent')).rejects.toThrow(
        new StreamingServiceError('Streaming not found in history', 404),
      );
    });

    it('should throw error when user history failed to update', async () => {
      mockRepository.findByUserId.mockResolvedValue(mockHistory);
      mockRepository.removeFromHistory.mockResolvedValue(null);
      const mockStreamingId = mockHistory.watchHistory?.[0]?.streamingId || '';
      await expect(service.removeStreamingFromHistory(mockUserId, mockStreamingId)).rejects.toThrow(
        new StreamingServiceError('Failed to update history', 404),
      );
    });
  });

  describe('getTotalWatchTime', () => {
    it('should return total watch time', async () => {
      mockRepository.findByUserId.mockResolvedValue(mockHistory);

      const result = await service.getTotalWatchTime(mockUserId);

      expect(result).toBe(mockHistory.totalWatchTimeInMinutes);
    });
  });

  describe('validateStreamingData', () => {
    it('should throw error for missing streamingId', async () => {
      const invalidData = { ...mockStreamingEntry, streamingId: '' };

      await expect(service.addStreamingToHistory(mockUserId, invalidData)).rejects.toThrow(
        new StreamingServiceError('Streaming ID is required', 400),
      );
    });

    it('should throw error for missing title', async () => {
      const invalidData = { ...mockStreamingEntry, title: '' };

      await expect(service.addStreamingToHistory(mockUserId, invalidData)).rejects.toThrow(
        new StreamingServiceError('Title is required', 400),
      );
    });

    it('should throw error for invalid duration', async () => {
      const invalidData = { ...mockStreamingEntry, durationInMinutes: -1 };

      await expect(service.addStreamingToHistory(mockUserId, invalidData)).rejects.toThrow(
        new StreamingServiceError('Invalid duration', 400),
      );
    });
  });
});

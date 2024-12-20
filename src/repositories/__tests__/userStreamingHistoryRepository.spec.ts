import { UserStreamingHistoryRepository } from '../userStreamingHistoryRepository';
import UserStreamingHistory from '../../models/userStreamingHistoryModel';
import { IUserStreamingHistory, StreamingHistoryEntry } from '../../models/userStreamingHistoryModel';

jest.mock('../../models/userStreamingHistoryModel');

describe('UserStreamingHistoryRepository', () => {
  let repository: UserStreamingHistoryRepository;

  const mockStreamingEntry: StreamingHistoryEntry = {
    streamingId: 'movie123',
    title: 'Test Movie',
    durationInMinutes: 120,
  };

  const mockHistory: IUserStreamingHistory = {
    _id: 'history123',
    userId: 'user123',
    watchHistory: [mockStreamingEntry],
    totalWatchTimeInMinutes: 120
  } as IUserStreamingHistory;

  beforeEach(() => {
    repository = new UserStreamingHistoryRepository();
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated streaming history list', async () => {
      const mockFind = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockHistory])
      };
      (UserStreamingHistory.find as jest.Mock).mockReturnValue(mockFind);

      const result = await repository.findAll(0, 10);

      expect(result).toEqual([mockHistory]);
      expect(UserStreamingHistory.find).toHaveBeenCalled();
      expect(mockFind.skip).toHaveBeenCalledWith(0);
      expect(mockFind.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('findById', () => {
    it('should find streaming history by id', async () => {
      (UserStreamingHistory.findById as jest.Mock).mockResolvedValue(mockHistory);

      const result = await repository.findById('history123');

      expect(result).toEqual(mockHistory);
      expect(UserStreamingHistory.findById).toHaveBeenCalledWith('history123');
    });

    it('should return null when id not found', async () => {
      (UserStreamingHistory.findById as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find streaming history by user id', async () => {
      (UserStreamingHistory.findOne as jest.Mock).mockResolvedValue(mockHistory);

      const result = await repository.findByUserId('user123');

      expect(result).toEqual(mockHistory);
      expect(UserStreamingHistory.findOne).toHaveBeenCalledWith({ userId: 'user123' });
    });

    it('should return null when user id not found', async () => {
      (UserStreamingHistory.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByUserId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new streaming history', async () => {
      const mockSave = jest.fn().mockResolvedValue(mockHistory);
      (UserStreamingHistory as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave
      }));

      const result = await repository.create(mockHistory);

      expect(result).toEqual(mockHistory);
      expect(UserStreamingHistory).toHaveBeenCalledWith(mockHistory);
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('addToHistory', () => {
    it('should add streaming entry to existing history', async () => {
      const mockFindOne = jest.fn().mockResolvedValue(mockHistory);
      const mockSave = jest.fn().mockResolvedValue({
        ...mockHistory,
        watchHistory: [...(mockHistory.watchHistory || []), mockStreamingEntry]
      });

      (UserStreamingHistory.findOne as jest.Mock).mockImplementation(mockFindOne);
      mockHistory.save = mockSave;

      const result = await repository.addToHistory('user123', mockStreamingEntry);

      expect(result.watchHistory).toHaveLength(2);
      expect(result.watchHistory).toContainEqual(mockStreamingEntry);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should create new history when user has none', async () => {
      const mockFindOne = jest.fn().mockResolvedValue(null);

      (UserStreamingHistory.findOne as jest.Mock).mockImplementation(mockFindOne);
      mockHistory.save = jest.fn().mockResolvedValue(mockHistory);

      const result = await repository.addToHistory('user123', mockStreamingEntry);
      
      expect(result).toEqual(mockHistory);
      expect(mockHistory.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update streaming history', async () => {
      const updatedHistory = { ...mockHistory, totalWatchTimeInMinutes: 240 };
      (UserStreamingHistory.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedHistory);

      const result = await repository.update('history123', { totalWatchTimeInMinutes: 240 });

      expect(result).toEqual(updatedHistory);
      expect(UserStreamingHistory.findByIdAndUpdate).toHaveBeenCalledWith(
        'history123',
        { $set: { totalWatchTimeInMinutes: 240 } },
        { new: true, runValidators: true }
      );
    });
  });

  describe('delete', () => {
    it('should delete streaming history', async () => {
      (UserStreamingHistory.findByIdAndDelete as jest.Mock).mockResolvedValue(mockHistory);

      const result = await repository.delete('history123');

      expect(result).toEqual(mockHistory);
      expect(UserStreamingHistory.findByIdAndDelete).toHaveBeenCalledWith('history123');
    });
  });

  describe('removeFromHistory', () => {
    it('should remove streaming from history', async () => {
      const updatedHistory = {
        ...mockHistory,
        watchHistory: [],
        totalWatchTimeInMinutes: 0
      };

      (UserStreamingHistory.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedHistory);

      const result = await repository.removeFromHistory('user123', 'movie123', 120);

      expect(result).toEqual(updatedHistory);
      expect(UserStreamingHistory.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: 'user123' },
        { 
          $pull: { watchHistory: { streamingId: 'movie123' } },
          $inc: { totalWatchTimeInMinutes: -120 }
        },
        { new: true }
      );
    });
  });
});
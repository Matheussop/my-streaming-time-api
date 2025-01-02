import { UserStreamingHistoryRepository } from '../userStreamingHistoryRepository';
import UserStreamingHistory from '../../models/userStreamingHistoryModel';
import { IUserStreamingHistory, StreamingHistoryEntry } from '../../models/userStreamingHistoryModel';

jest.mock('../../models/userStreamingHistoryModel');

type MockDocument = Partial<IUserStreamingHistory> & {
  save: jest.Mock;
};

describe('UserStreamingHistoryRepository', () => {
  let repository: UserStreamingHistoryRepository;
  let mockHistory: MockDocument;
  let mockSave: jest.Mock;

  const mockStreamingEntry: StreamingHistoryEntry = {
    streamingId: 'movie123',
    title: 'Test Movie',
    durationInMinutes: 120,
  };

  beforeEach(() => {
    mockHistory = {
      _id: 'history123',
      userId: 'user123',
      watchHistory: [mockStreamingEntry],
      totalWatchTimeInMinutes: 120,
      save: jest.fn(),
    };

    mockSave = jest.fn().mockResolvedValue(mockHistory);
    (UserStreamingHistory as unknown as jest.Mock).mockImplementation(() => ({
      save: mockSave,
    }));

    jest.spyOn(UserStreamingHistory, 'find').mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([mockHistory]),
    } as any);
    jest.spyOn(UserStreamingHistory, 'findById').mockResolvedValue(mockHistory);
    jest.spyOn(UserStreamingHistory, 'findOne').mockResolvedValue(mockHistory);
    jest.spyOn(UserStreamingHistory, 'findByIdAndUpdate').mockResolvedValue(mockHistory);
    jest.spyOn(UserStreamingHistory, 'findByIdAndDelete').mockResolvedValue(mockHistory);
    jest.spyOn(UserStreamingHistory, 'findOneAndUpdate').mockResolvedValue(mockHistory);

    repository = new UserStreamingHistoryRepository();
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated streaming history list', async () => {
      const result = await repository.findAll(0, 10);

      expect(result).toEqual([mockHistory]);
      expect(UserStreamingHistory.find).toHaveBeenCalled();
    });

    it('should return paginated streaming history list without params for pagination', async () => {
      const result = await repository.findAll(0, 10);

      expect(result).toEqual([mockHistory]);
      expect(UserStreamingHistory.find).toHaveBeenCalled();
    })
  });

  describe('findById', () => {
    it('should find streaming history by id', async () => {
      const result = await repository.findById('history123');

      expect(result).toEqual(mockHistory);
      expect(UserStreamingHistory.findById).toHaveBeenCalledWith('history123');
    });

    it('should return null when id not found', async () => {
      jest.spyOn(UserStreamingHistory, 'findById').mockResolvedValueOnce(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find streaming history by user id', async () => {
      const result = await repository.findByUserId('user123');

      expect(result).toEqual(mockHistory);
      expect(UserStreamingHistory.findOne).toHaveBeenCalledWith({ userId: 'user123' });
    });

    it('should return null when user id not found', async () => {
      jest.spyOn(UserStreamingHistory, 'findOne').mockResolvedValueOnce(null);
      const result = await repository.findByUserId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new streaming history', async () => {
      mockHistory.save = mockSave;

      const result = await repository.create(mockHistory);

      expect(result).toEqual(mockHistory);
      expect(UserStreamingHistory).toHaveBeenCalledWith(mockHistory);
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('addToHistory', () => {
    it('should create new history when user has none', async () => {
      jest.spyOn(UserStreamingHistory, 'findOne').mockResolvedValueOnce(null);
      mockHistory.save = mockSave;
      const result = await repository.addToHistory('user123', mockStreamingEntry);

      expect(result).toEqual(expect.objectContaining(mockHistory));
      expect(mockSave).toHaveBeenCalled();
      expect(UserStreamingHistory).toHaveBeenCalledWith({
        userId: 'user123',
        watchHistory: [],
        totalWatchTimeInMinutes: 0,
      });
    });

    it('should add streaming entry to existing history', async () => {
      const existingHistory = {
        ...mockHistory,
        watchHistory: [],
        save: mockSave,
      };

      jest.spyOn(UserStreamingHistory, 'findOne').mockResolvedValueOnce(existingHistory);

      const result = await repository.addToHistory('user123', mockStreamingEntry);

      expect(result.watchHistory).toHaveLength(1);
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update streaming history', async () => {
      const updatedHistory = { ...mockHistory, totalWatchTimeInMinutes: 240 };
      jest.spyOn(UserStreamingHistory, 'findByIdAndUpdate').mockResolvedValueOnce(updatedHistory);

      const result = await repository.update('history123', { totalWatchTimeInMinutes: 240 });

      expect(result).toEqual(updatedHistory);
      expect(UserStreamingHistory.findByIdAndUpdate).toHaveBeenCalledWith(
        'history123',
        { $set: { totalWatchTimeInMinutes: 240 } },
        { new: true, runValidators: true },
      );
    });
  });

  describe('delete', () => {
    it('should delete streaming history', async () => {
      jest.spyOn(UserStreamingHistory, 'findByIdAndDelete').mockResolvedValueOnce(mockHistory);
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
        totalWatchTimeInMinutes: 0,
      };

      jest.spyOn(UserStreamingHistory, 'findOneAndUpdate').mockResolvedValueOnce(updatedHistory);

      const result = await repository.removeFromHistory('user123', 'movie123', 120);

      expect(result).toEqual(updatedHistory);
      expect(UserStreamingHistory.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: 'user123' },
        {
          $pull: { watchHistory: { streamingId: 'movie123' } },
          $inc: { totalWatchTimeInMinutes: -120 },
        },
        { new: true },
      );
    });
  });
});

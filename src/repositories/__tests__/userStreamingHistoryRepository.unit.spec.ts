import { Types } from 'mongoose';
import { UserStreamingHistoryRepository } from '../userStreamingHistoryRepository';
import UserStreamingHistory from '../../models/userStreamingHistoryModel';
import { IUserStreamingHistoryResponse, WatchHistoryEntry, EpisodeWatched } from '../../interfaces/userStreamingHistory';

jest.mock('../../models/userStreamingHistoryModel');

describe('UserStreamingHistoryRepository', () => {
  let repository: UserStreamingHistoryRepository;
  let mockHistory: IUserStreamingHistoryResponse;
  let mockWatchHistoryEntry: WatchHistoryEntry;
  let mockEpisodeWatched: EpisodeWatched;

  beforeEach(() => {
    repository = new UserStreamingHistoryRepository();

    mockWatchHistoryEntry = {
      contentId: new Types.ObjectId().toString(),
      contentType: 'movie',
      title: 'Test Movie',
      watchedDurationInMinutes: 120,
      watchedAt: new Date(),
      completionPercentage: 100,
      rating: 5
    };

    mockEpisodeWatched = {
      episodeId: new Types.ObjectId().toString(),
      seasonNumber: 1,
      episodeNumber: 1,
      watchedDurationInMinutes: 45,
      watchedAt: new Date(),
      completionPercentage: 100
    };

    mockHistory = {
      _id: new Types.ObjectId().toString(),
      userId: new Types.ObjectId().toString(),
      watchHistory: [mockWatchHistoryEntry],
      totalWatchTimeInMinutes: 120,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    jest.spyOn(UserStreamingHistory, 'find').mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockHistory])
      })
    } as any);

    jest.spyOn(UserStreamingHistory, 'findById').mockResolvedValue(mockHistory);
    jest.spyOn(UserStreamingHistory, 'findOne').mockResolvedValue(mockHistory);
    jest.spyOn(UserStreamingHistory, 'create').mockResolvedValue(mockHistory as any);
    jest.spyOn(UserStreamingHistory, 'findByIdAndUpdate').mockResolvedValue(mockHistory);
    jest.spyOn(UserStreamingHistory, 'findByIdAndDelete').mockResolvedValue(mockHistory);
    jest.spyOn(UserStreamingHistory, 'addWatchHistoryEntry').mockResolvedValue(mockHistory);
    jest.spyOn(UserStreamingHistory, 'getWatchHistory').mockResolvedValue([mockHistory]);
    jest.spyOn(UserStreamingHistory, 'hasWatched').mockResolvedValue(true);
    jest.spyOn(UserStreamingHistory, 'removeWatchHistoryEntry').mockResolvedValue(mockHistory);
    jest.spyOn(UserStreamingHistory, 'removeEpisodeFromHistory').mockResolvedValue(mockWatchHistoryEntry);
    jest.spyOn(UserStreamingHistory, 'updateEpisodeProgress').mockResolvedValue(mockWatchHistoryEntry);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all histories with pagination', async () => {
      const result = await repository.findAll(0, 10);

      expect(UserStreamingHistory.find).toHaveBeenCalled();
      expect(result).toEqual([mockHistory]);
    });
  });

  describe('findById', () => {
    it('should return history by id', async () => {
      const result = await repository.findById(mockHistory._id.toString());

      expect(UserStreamingHistory.findById).toHaveBeenCalledWith(mockHistory._id.toString());
      expect(result).toEqual(mockHistory);
    });

    it('should return null if history not found', async () => {
      jest.spyOn(UserStreamingHistory, 'findById').mockResolvedValue(null);

      const result = await repository.findById(mockHistory._id.toString());

      expect(UserStreamingHistory.findById).toHaveBeenCalledWith(mockHistory._id.toString());
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return history by user id', async () => {
      const result = await repository.findByUserId(mockHistory.userId.toString());

      expect(UserStreamingHistory.findOne).toHaveBeenCalledWith({ userId: mockHistory.userId.toString() });
      expect(result).toEqual(mockHistory);
    });

    it('should return null if history not found', async () => {
      jest.spyOn(UserStreamingHistory, 'findOne').mockResolvedValue(null);

      const result = await repository.findByUserId(mockHistory.userId.toString());

      expect(UserStreamingHistory.findOne).toHaveBeenCalledWith({ userId: mockHistory.userId.toString() });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new history', async () => {
      const result = await repository.create(mockHistory);

      expect(UserStreamingHistory.create).toHaveBeenCalledWith(mockHistory);
      expect(result).toEqual(mockHistory);
    });
  });

  describe('addWatchHistoryEntry', () => {
    it('should add a new watch history entry', async () => {
      const result = await repository.addWatchHistoryEntry(mockHistory.userId.toString(), mockWatchHistoryEntry);

      expect(UserStreamingHistory.addWatchHistoryEntry).toHaveBeenCalledWith(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry
      );
      expect(result).toEqual(mockHistory);
    });
  });

  describe('getWatchHistory', () => {
    it('should return watch history with pagination', async () => {
      const result = await repository.getWatchHistory(mockHistory.userId.toString(), 0, 10);

      expect(UserStreamingHistory.getWatchHistory).toHaveBeenCalledWith(
        mockHistory.userId.toString(),
        0,
        10
      );
      expect(result).toEqual([mockHistory]);
    });

    it('should return null if no history found', async () => {
      jest.spyOn(UserStreamingHistory, 'getWatchHistory').mockResolvedValue(null);

      const result = await repository.getWatchHistory(mockHistory.userId.toString(), 0, 10);

      expect(UserStreamingHistory.getWatchHistory).toHaveBeenCalledWith(
        mockHistory.userId.toString(),
        0,
        10
      );
      expect(result).toBeNull();
    });
  });

  describe('hasWatched', () => {
    it('should return true if content has been watched', async () => {
      const result = await repository.hasWatched(mockHistory.userId.toString(), mockWatchHistoryEntry.contentId.toString(), mockWatchHistoryEntry.contentType);

      expect(UserStreamingHistory.hasWatched).toHaveBeenCalledWith(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString(),
        mockWatchHistoryEntry.contentType
      );
      expect(result).toBe(true);
    });

    it('should return false if content has not been watched', async () => {
      jest.spyOn(UserStreamingHistory, 'hasWatched').mockResolvedValue(false);

      const result = await repository.hasWatched(mockHistory.userId.toString(), mockWatchHistoryEntry.contentId.toString(), mockWatchHistoryEntry.contentType);

      expect(UserStreamingHistory.hasWatched).toHaveBeenCalledWith(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString(),
        mockWatchHistoryEntry.contentType
      );
      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    it('should update history', async () => {
      const result = await repository.update(mockHistory._id.toString(), mockHistory);

      expect(UserStreamingHistory.findByIdAndUpdate).toHaveBeenCalledWith(
        mockHistory._id.toString(),
        { $set: mockHistory },
        { new: true, runValidators: true }
      );
      expect(result).toEqual(mockHistory);
    });

    it('should return null if history not found', async () => {
      jest.spyOn(UserStreamingHistory, 'findByIdAndUpdate').mockResolvedValue(null);

      const result = await repository.update(mockHistory._id.toString(), mockHistory);

      expect(UserStreamingHistory.findByIdAndUpdate).toHaveBeenCalledWith(
        mockHistory._id.toString(),
        { $set: mockHistory },
        { new: true, runValidators: true }
      );
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete history', async () => {
      const result = await repository.delete(mockHistory._id.toString());

      expect(UserStreamingHistory.findByIdAndDelete).toHaveBeenCalledWith(mockHistory._id.toString());
      expect(result).toEqual(mockHistory);
    });

    it('should return null if history not found', async () => {
      jest.spyOn(UserStreamingHistory, 'findByIdAndDelete').mockResolvedValue(null);

      const result = await repository.delete(mockHistory._id.toString());

      expect(UserStreamingHistory.findByIdAndDelete).toHaveBeenCalledWith(mockHistory._id.toString());
      expect(result).toBeNull();
    });
  });

  describe('removeWatchHistoryEntry', () => {
    it('should remove watch history entry', async () => {
      const result = await repository.removeWatchHistoryEntry(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString()
      );

      expect(UserStreamingHistory.removeWatchHistoryEntry).toHaveBeenCalledWith(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString()
      );
      expect(result).toEqual(mockHistory);
    });

    it('should return null if entry not found', async () => {
      jest.spyOn(UserStreamingHistory, 'removeWatchHistoryEntry').mockResolvedValue(null);

      const result = await repository.removeWatchHistoryEntry(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString()
      );

      expect(UserStreamingHistory.removeWatchHistoryEntry).toHaveBeenCalledWith(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString()
      );
      expect(result).toBeNull();
    });
  });

  describe('removeEpisodeFromHistory', () => {
    it('should remove episode from history', async () => {
      const result = await repository.removeEpisodeFromHistory(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString(),
        mockEpisodeWatched.episodeId.toString()
      );

      expect(UserStreamingHistory.removeEpisodeFromHistory).toHaveBeenCalledWith(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString(),
        mockEpisodeWatched.episodeId.toString()
      );
      expect(result).toEqual(mockWatchHistoryEntry);
    });

    it('should return null if episode not found', async () => {
      jest.spyOn(UserStreamingHistory, 'removeEpisodeFromHistory').mockResolvedValue(null);

      const result = await repository.removeEpisodeFromHistory(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString(),
        mockEpisodeWatched.episodeId.toString()
      );

      expect(UserStreamingHistory.removeEpisodeFromHistory).toHaveBeenCalledWith(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString(),
        mockEpisodeWatched.episodeId.toString()
      );
      expect(result).toBeNull();
    });
  });

  describe('updateEpisodeProgress', () => {
    it('should update episode progress', async () => {
      const result = await repository.updateEpisodeProgress(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString(),
        mockEpisodeWatched
      );

      expect(UserStreamingHistory.updateEpisodeProgress).toHaveBeenCalledWith(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString(),
        mockEpisodeWatched
      );
      expect(result).toEqual(mockWatchHistoryEntry);
    });

    it('should return null if episode not found', async () => {
      jest.spyOn(UserStreamingHistory, 'updateEpisodeProgress').mockResolvedValue(null);

      const result = await repository.updateEpisodeProgress(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString(),
        mockEpisodeWatched
      );

      expect(UserStreamingHistory.updateEpisodeProgress).toHaveBeenCalledWith(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString(),
        mockEpisodeWatched
      );
      expect(result).toBeNull();
    });
  });

  describe('updateSeasonProgress', () => {
    it('should update season progress', async () => {
      const episodesWatched: EpisodeWatched[] = [mockEpisodeWatched];
  
      jest.spyOn(UserStreamingHistory, 'updateSeasonProgress').mockResolvedValue(mockWatchHistoryEntry);
  
      const result = await repository.updateSeasonProgress(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString(),
        episodesWatched
      );
  
      expect(UserStreamingHistory.updateSeasonProgress).toHaveBeenCalledWith(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString(),
        episodesWatched
      );
      expect(result).toEqual(mockWatchHistoryEntry);
    });
  
    it('should return null if season progress not updated', async () => {
      const episodesWatched: EpisodeWatched[] = [mockEpisodeWatched];
  
      jest.spyOn(UserStreamingHistory, 'updateSeasonProgress').mockResolvedValue(null);
  
      const result = await repository.updateSeasonProgress(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString(),
        episodesWatched
      );
  
      expect(result).toBeNull();
    });
  });
  
  describe('unMarkSeasonAsWatched', () => {
    it('should unmark season as watched', async () => {
      jest.spyOn(UserStreamingHistory, 'unMarkSeasonAsWatched').mockResolvedValue(mockWatchHistoryEntry);
  
      const result = await repository.unMarkSeasonAsWatched(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString(),
        1
      );
  
      expect(UserStreamingHistory.unMarkSeasonAsWatched).toHaveBeenCalledWith(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString(),
        1
      );
      expect(result).toEqual(mockWatchHistoryEntry);
    });
  
    it('should return null if unmark fails', async () => {
      jest.spyOn(UserStreamingHistory, 'unMarkSeasonAsWatched').mockResolvedValue(null);
  
      const result = await repository.unMarkSeasonAsWatched(
        mockHistory.userId.toString(),
        mockWatchHistoryEntry.contentId.toString(),
        1
      );
  
      expect(result).toBeNull();
    });
  });
  
}); 
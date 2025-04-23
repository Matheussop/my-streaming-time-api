import { Types } from "mongoose";
import { IEpisode, ISeasonResponse, SeasonStatus } from "../../interfaces/series/season";
import { SeasonRepository } from "../../repositories/seasonRepository";
import { TMDBService } from "../tmdbService";
import { SeasonCacheService } from "../seasonCacheService";
import { generateValidObjectId } from "../../util/__tests__/generateValidObjectId";

// Mock dos módulos externos
jest.mock('cron', () => {
  return {
    CronJob: jest.fn().mockImplementation((cronTime, onTick) => {
      return {
        start: jest.fn(),
        stop: jest.fn(),
        cronTime,
        onTick
      };
    })
  };
});

jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('SeasonCacheService', () => {
  let seasonCacheService: SeasonCacheService;
  let mockSeasonRepository: jest.Mocked<SeasonRepository>;
  let mockTMDBService: jest.Mocked<TMDBService>;

  const mockEpisode: IEpisode = {
    _id: generateValidObjectId() as Types.ObjectId,
    episodeNumber: 1,
    title: 'Test Episode',
    plot: 'Test plot',
    durationInMinutes: 45,
    releaseDate: '2024-03-20',
    poster: '/poster.jpg'
  };

  const mockSeasonId = generateValidObjectId() as Types.ObjectId;
  const mockSeriesId = generateValidObjectId() as Types.ObjectId;

  const mockSeason: ISeasonResponse = {
    _id: mockSeasonId,
    seriesId: mockSeriesId,
    seasonNumber: 1,
    title: 'Test Season',
    plot: 'Test plot',
    releaseDate: '2024-03-20',
    poster: '/poster.jpg',
    episodeCount: 10,
    episodes: [mockEpisode],
    tmdbId: 12345,
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
    status: 'ONGOING' as SeasonStatus,
    lastUpdated: new Date('2024-03-20')
  };

  const mockTMDBEpisodes = {
    episodes: [
      {
        episode_number: 1,
        name: 'Test Episode',
        overview: 'Test plot',
        runtime: 45,
        air_date: '2024-03-20',
        still_path: '/poster.jpg'
      },
      {
        episode_number: 2,
        name: 'Test Episode 2',
        overview: 'Test plot 2',
        runtime: 50,
        air_date: '2024-03-27',
        still_path: '/poster2.jpg'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSeasonRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySeriesId: jest.fn(),
      findEpisodesBySeasonNumber: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByStatus: jest.fn(),
      findPopularSeasons: jest.fn(),
      updateSeasonAccessCount: jest.fn()
    } as unknown as jest.Mocked<SeasonRepository>;

    mockTMDBService = {
      fetchEpisodes: jest.fn()
    } as unknown as jest.Mocked<TMDBService>;

    process.env.NUMBER_POPULARITY_THRESHOLD = '7';

    seasonCacheService = new SeasonCacheService(mockSeasonRepository, mockTMDBService);
  });

  afterEach(() => {
    delete process.env.NUMBER_POPULARITY_THRESHOLD;
  });

  describe('shouldUpdateSeason', () => {
    it('should return true if season has no lastUpdated field', async () => {
      const seasonWithoutLastUpdated = { ...mockSeason, lastUpdated: undefined };
      const result = await seasonCacheService.shouldUpdateSeason(seasonWithoutLastUpdated as ISeasonResponse);
      expect(result).toBe(true);
    });

    it('should return true if season has no status field', async () => {
      const seasonWithoutStatus = { ...mockSeason, status: null } as unknown as ISeasonResponse;
      const result = await seasonCacheService.shouldUpdateSeason(seasonWithoutStatus as ISeasonResponse);
      expect(result).toBe(true);
    });

    it('should return true if today is the release day for an ongoing season', async () => {
      // Mock current date to be the same weekday as the release day
      const now = new Date();
      const releaseWeekday = now.getDay();
      const seasonWithReleaseDay = { 
        ...mockSeason, 
        status: 'ONGOING' as SeasonStatus,
        releaseWeekday,
        lastUpdated: new Date(now.getTime() - 1000 * 60 * 60) // 1 hour ago
      };
      
      const result = await seasonCacheService.shouldUpdateSeason(seasonWithReleaseDay);
      expect(result).toBe(true);
      expect(mockSeasonRepository.updateSeasonAccessCount).toHaveBeenCalledWith(mockSeasonId);
    });

    it('should return true if data is older than TTL for ongoing season', async () => {
      // Set last updated to 2 days ago (exceeds 1 day TTL for ONGOING)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const seasonWithOldData = { 
        ...mockSeason, 
        status: 'ONGOING' as SeasonStatus,
        lastUpdated: twoDaysAgo,
        releaseWeekday: (new Date().getDay() + 1) % 7 // different day from today
      };
      
      const result = await seasonCacheService.shouldUpdateSeason(seasonWithOldData);
      expect(result).toBe(true);
      expect(mockSeasonRepository.updateSeasonAccessCount).toHaveBeenCalledWith(mockSeasonId);
    });

    it('should return false if data is fresh for ongoing season and not release day', async () => {
      // Set last updated to 1 hour ago (within 1 day TTL for ONGOING)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const seasonWithFreshData = { 
        ...mockSeason, 
        status: 'ONGOING' as SeasonStatus,
        lastUpdated: oneHourAgo,
        releaseWeekday: (new Date().getDay() + 1) % 7 // different day from today
      };
      
      const result = await seasonCacheService.shouldUpdateSeason(seasonWithFreshData);
      expect(result).toBe(false);
      expect(mockSeasonRepository.updateSeasonAccessCount).toHaveBeenCalledWith(mockSeasonId);
    });

    it('should handle special interest seasons with on_access strategy', async () => {
      // Set last updated to 2 hours ago (exceeds 1 hour minimum interval)
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      
      const specialInterestSeason = { 
        ...mockSeason, 
        status: 'SPECIAL_INTEREST' as SeasonStatus,
        lastUpdated: twoHoursAgo
      };
      
      const result = await seasonCacheService.shouldUpdateSeason(specialInterestSeason);
      expect(result).toBe(true);
      expect(mockSeasonRepository.updateSeasonAccessCount).toHaveBeenCalledWith(mockSeasonId);
    });

    it('should handle completed seasons with passive strategy', async () => {
      // Set last updated to 1 month ago (within 6 months TTL for COMPLETED)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const completedSeason = { 
        ...mockSeason, 
        status: 'COMPLETED' as SeasonStatus,
        lastUpdated: oneMonthAgo
      };
      
      const result = await seasonCacheService.shouldUpdateSeason(completedSeason);
      expect(result).toBe(false);
      expect(mockSeasonRepository.updateSeasonAccessCount).toHaveBeenCalledWith(mockSeasonId);
    });
  });

  describe('updateSeasonData', () => {
    it('should return false if required fields are missing', async () => {
      const invalidSeason: ISeasonResponse = {
        ...mockSeason,
        tmdbId: undefined as unknown as number
      };
      const result = await seasonCacheService.updateSeasonData(invalidSeason);
      expect(result).toBe(false);
      expect(mockTMDBService.fetchEpisodes).not.toHaveBeenCalled();
    });

    it('should return false if TMDB service fails to fetch episodes', async () => {
      mockTMDBService.fetchEpisodes.mockResolvedValue(null);
      const result = await seasonCacheService.updateSeasonData(mockSeason);
      expect(result).toBe(false);
      expect(mockTMDBService.fetchEpisodes).toHaveBeenCalledWith(mockSeason.tmdbId, mockSeason.seasonNumber);
      expect(mockSeasonRepository.update).not.toHaveBeenCalled();
    });

    it('should update existing episodes and add new ones', async () => {
      mockTMDBService.fetchEpisodes.mockResolvedValue(mockTMDBEpisodes);
      mockSeasonRepository.update.mockResolvedValue({ 
        ...mockSeason,
        episodes: [
          mockEpisode,
          { 
            _id: generateValidObjectId() as Types.ObjectId,
            episodeNumber: 2,
            title: 'Test Episode 2',
            plot: 'Test plot',
            durationInMinutes: 45,
            releaseDate: '2024-03-27',
            poster: '/poster.jpg'
          }
        ]
      });
      
      const result = await seasonCacheService.updateSeasonData(mockSeason);
      
      expect(result).toBe(true);
      expect(mockTMDBService.fetchEpisodes).toHaveBeenCalledWith(mockSeason.tmdbId, mockSeason.seasonNumber);
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        mockSeasonId,
        expect.objectContaining({
          episodes: expect.arrayContaining([
            expect.objectContaining({ episodeNumber: 1 }),
            expect.objectContaining({ episodeNumber: 2 })
          ]),
          status: expect.any(String),
          lastUpdated: expect.any(Date)
        })
      );
    });

    it('should determine correct status for a completed season', async () => {
      // All episodes complete with past release dates
      mockTMDBService.fetchEpisodes.mockResolvedValue({
        episodes: [
          {
            episode_number: 1,
            name: 'Test Episode',
            overview: 'Test plot',
            runtime: 45,
            air_date: '2023-03-20', // Past date
            still_path: '/poster.jpg'
          }
        ]
      });
      
      await seasonCacheService.updateSeasonData(mockSeason);
      
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        mockSeasonId,
        expect.objectContaining({
          status: 'COMPLETED'
        })
      );
    });

    it('should determine correct status for an ongoing season', async () => {
      // Mix of past and future episodes
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const pastDateStr = pastDate.toISOString().split('T')[0];
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      mockTMDBService.fetchEpisodes.mockResolvedValue({
        episodes: [
          {
            episode_number: 1,
            name: 'Past Episode',
            overview: 'Test plot',
            runtime: 45,
            air_date: pastDateStr,
            still_path: '/poster.jpg'
          },
          {
            episode_number: 2,
            name: 'Future Episode',
            overview: 'Test plot 2',
            runtime: 50,
            air_date: futureDateStr,
            still_path: '/poster2.jpg'
          }
        ]
      });
      
      await seasonCacheService.updateSeasonData(mockSeason);
      
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        mockSeasonId,
        expect.objectContaining({
          status: 'ONGOING',
          nextEpisodeDate: expect.any(Date)
        })
      );
    });

    it('should determine correct status for an upcoming season', async () => {
      // All episodes with future release dates
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      mockTMDBService.fetchEpisodes.mockResolvedValue({
        episodes: [
          {
            episode_number: 1,
            name: 'Future Episode',
            overview: 'Test plot',
            runtime: 45,
            air_date: futureDateStr,
            still_path: '/poster.jpg'
          }
        ]
      });
      
      await seasonCacheService.updateSeasonData(mockSeason);
      
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        mockSeasonId,
        expect.objectContaining({
          status: 'UPCOMING',
          nextEpisodeDate: expect.any(Date)
        })
      );
    });
  });

  describe('recordAccess', () => {
    it('should increment access count and update lastAccessed', async () => {
      mockSeasonRepository.updateSeasonAccessCount.mockResolvedValue(mockSeason);
      mockSeasonRepository.findById.mockResolvedValue({ 
        ...mockSeason, 
        accessCount: 5
      });
      
      await (seasonCacheService as any).recordAccess(mockSeasonId);
      
      expect(mockSeasonRepository.updateSeasonAccessCount).toHaveBeenCalledWith(mockSeasonId);
      expect(mockSeasonRepository.findById).toHaveBeenCalledWith(mockSeasonId);
      expect(mockSeasonRepository.update).not.toHaveBeenCalled(); // Shouldn't update as count < threshold
    });

    it('should update status to SPECIAL_INTEREST when threshold is reached', async () => {
      mockSeasonRepository.updateSeasonAccessCount.mockResolvedValue(mockSeason);
      mockSeasonRepository.findById.mockResolvedValue({ 
        ...mockSeason, 
        accessCount: 8, // Above threshold (7)
        status: 'ONGOING' as SeasonStatus
      });
      
      // Mock updateSeasonData to prevent actual execution
      jest.spyOn(seasonCacheService, 'updateSeasonData').mockResolvedValue(true);
      
      await (seasonCacheService as any).recordAccess(mockSeasonId);
      
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        mockSeasonId,
        { status: 'SPECIAL_INTEREST' }
      );
      expect(seasonCacheService.updateSeasonData).toHaveBeenCalled();
    });
  });
}); 
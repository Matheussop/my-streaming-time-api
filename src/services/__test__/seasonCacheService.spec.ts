import { Types } from "mongoose";
import { IEpisode, ISeasonResponse, SeasonStatus } from "../../interfaces/series/season";
import { SeasonRepository } from "../../repositories/seasonRepository";
import { TMDBService } from "../tmdbService";
import { SeasonCacheService } from "../seasonCacheService";
import { generateValidObjectId } from "../../util/__tests__/generateValidObjectId";
import logger from "../../config/logger";

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
  error: jest.fn(),
  info: jest.fn()
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

    it('should update existing episodes with a different title', async () => {
      const mockTMDBEpisodes2 = {
        ...mockTMDBEpisodes,
        episodes: [
          ...mockTMDBEpisodes.episodes,
          {
            episode_number: 1,
            name: 'New Title',
            overview: 'Test plot',
            air_date: '2024-03-20',
            runtime: 45,
            still_path: '/poster.jpg'
          }
        ]
      };


      mockTMDBService.fetchEpisodes.mockResolvedValue(mockTMDBEpisodes2);
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

    it('should update episodes without existing episodes', async () => {
      mockTMDBService.fetchEpisodes.mockResolvedValue({
        episodes: [mockTMDBEpisodes.episodes[0]]
      });

      mockSeasonRepository.update.mockResolvedValue({ 
        ...mockSeason,
        episodes: [mockEpisode]
      });

      const mockSeasonWithoutEpisodes = {
        ...mockSeason,
        episodes: []
      }
      const result = await seasonCacheService.updateSeasonData(mockSeasonWithoutEpisodes);

      expect(result).toBe(true);
      expect(mockTMDBService.fetchEpisodes).toHaveBeenCalledWith(mockSeason.tmdbId, mockSeason.seasonNumber);
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(mockSeasonId, expect.objectContaining({ episodes: expect.any(Array) }));
    });

    it('should log error when season is not found', async () => {
      mockTMDBService.fetchEpisodes.mockRejectedValue(new Error('Season not found'));
      const result = await seasonCacheService.updateSeasonData(mockSeason);
      expect(result).toBe(false);
      expect(mockTMDBService.fetchEpisodes).toHaveBeenCalledWith(mockSeason.tmdbId, mockSeason.seasonNumber);
      expect(mockSeasonRepository.update).not.toHaveBeenCalled();
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

    it('should update without optional fields', async () => {
      // All episodes complete with past release dates
      mockTMDBService.fetchEpisodes.mockResolvedValue({
        episodes: [
          {
            episode_number: 1,
            name: 'Test Episode',
          }
        ]
      });
      
      await seasonCacheService.updateSeasonData(mockSeason);
      
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        mockSeasonId,
        expect.objectContaining({
          status: 'UPCOMING',
          lastUpdated: expect.any(Date)
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

    it('should use default threshold when env variable is not set', async () => {
      delete process.env.NUMBER_POPULARITY_THRESHOLD;
      
      mockSeasonRepository.updateSeasonAccessCount.mockResolvedValue(mockSeason);
      mockSeasonRepository.findById.mockResolvedValue({ 
        ...mockSeason, 
        accessCount: 8, // Above default threshold (7)
        status: 'ONGOING' as SeasonStatus
      });
      
      jest.spyOn(seasonCacheService, 'updateSeasonData').mockResolvedValue(true);
      
      await (seasonCacheService as any).recordAccess(mockSeasonId);
      
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        mockSeasonId,
        { status: 'SPECIAL_INTEREST' }
      );
    });

    it('should log error when season is not found', async () => {
      delete process.env.NUMBER_POPULARITY_THRESHOLD;
      mockSeasonRepository.updateSeasonAccessCount.mockResolvedValue(mockSeason);
      mockSeasonRepository.findById.mockRejectedValue(new Error('Season not found'));
      
      await (seasonCacheService as any).recordAccess(mockSeasonId);
      
      expect(mockSeasonRepository.updateSeasonAccessCount).toHaveBeenCalledWith(mockSeasonId);
      expect(mockSeasonRepository.findById).toHaveBeenCalledWith(mockSeasonId);
      expect(mockSeasonRepository.update).not.toHaveBeenCalled(); 
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('determineSeasonStatus', () => {
    it('should return UPCOMING if episodes array is empty', () => {
      const status = (seasonCacheService as any).determineSeasonStatus(mockSeason, []);
      expect(status).toBe('UPCOMING');
    });

    it('should return COMPLETED if all episodes have complete data and past release dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const pastDateStr = pastDate.toISOString().split('T')[0];

      const completeEpisodes = [
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 1,
          title: 'Episode 1',
          plot: 'Plot 1',
          durationInMinutes: 45,
          releaseDate: pastDateStr,
          poster: '/poster1.jpg'
        },
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 2,
          title: 'Episode 2',
          plot: 'Plot 2',
          durationInMinutes: 50,
          releaseDate: pastDateStr,
          poster: '/poster2.jpg'
        }
      ];

      const status = (seasonCacheService as any).determineSeasonStatus(mockSeason, completeEpisodes);
      expect(status).toBe('COMPLETED');
    });

    it('should return ONGOING if some episodes have been released and some have not', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const pastDateStr = pastDate.toISOString().split('T')[0];

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const mixedEpisodes = [
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 1,
          title: 'Episode 1',
          plot: 'Plot 1',
          durationInMinutes: 45,
          releaseDate: pastDateStr,
          poster: '/poster1.jpg'
        },
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 2,
          title: 'Episode 2',
          plot: 'Plot 2',
          durationInMinutes: 50,
          releaseDate: futureDateStr,
          poster: '/poster2.jpg'
        }
      ];

      const status = (seasonCacheService as any).determineSeasonStatus(mockSeason, mixedEpisodes);
      expect(status).toBe('ONGOING');
    });

    it('should return UPCOMING if all episodes have future release dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const futureEpisodes = [
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 1,
          title: 'Episode 1',
          plot: 'Plot 1',
          durationInMinutes: 45,
          releaseDate: futureDateStr,
          poster: '/poster1.jpg'
        },
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 2,
          title: 'Episode 2',
          plot: 'Plot 2',
          durationInMinutes: 50,
          releaseDate: futureDateStr,
          poster: '/poster2.jpg'
        }
      ];

      const status = (seasonCacheService as any).determineSeasonStatus(mockSeason, futureEpisodes);
      expect(status).toBe('UPCOMING');
    });

    it('should return UPCOMING if episodes have incomplete data', () => {
      const incompleteEpisodes = [
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 1,
          title: 'Episode 1',
          plot: '', // missing plot
          durationInMinutes: 0, // missing duration
          releaseDate: '', // missing release date
          poster: '/poster1.jpg'
        }
      ];

      const status = (seasonCacheService as any).determineSeasonStatus(mockSeason, incompleteEpisodes);
      expect(status).toBe('UPCOMING');
    });
  });

  describe('calculateReleaseWeekday', () => {
    it('should return undefined if there are less than 2 episodes with release dates', () => {
      const episodes = [
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 1,
          title: 'Episode 1',
          plot: 'Plot 1',
          durationInMinutes: 45,
          releaseDate: '2024-03-20', // A Wednesday
          poster: '/poster1.jpg'
        }
      ];

      const weekday = (seasonCacheService as any).calculateReleaseWeekday(episodes);
      expect(weekday).toBeUndefined();
    });

    it('should return the most common weekday from episode release dates', () => {
      // Create episodes with release dates on different days, with Wednesday (3) being most common
      const episodes = [
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 1,
          title: 'Episode 1',
          plot: 'Plot 1',
          durationInMinutes: 45,
          releaseDate: '2024-03-20', // Wednesday (3)
          poster: '/poster1.jpg'
        },
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 2,
          title: 'Episode 2',
          plot: 'Plot 2',
          durationInMinutes: 50,
          poster: '/poster2.jpg'
        },
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 3,
          title: 'Episode 3',
          plot: 'Plot 3',
          durationInMinutes: 55,
          releaseDate: '2024-03-29', // Friday (5)
          poster: '/poster3.jpg'
        }
      ];

      // Mock the getDay method to return fixed values for our test dates
      const originalGetDay = Date.prototype.getDay;
      Date.prototype.getDay = function() {
        const dateStr = this.toISOString().split('T')[0];
        switch(dateStr) {
          case '2024-03-20': return 3; // Wednesday
          case '2024-03-27': return 3; // Wednesday
          case '2024-03-29': return 5; // Friday
          default: return originalGetDay.call(this);
        }
      };

      try {
        const weekday = (seasonCacheService as any).calculateReleaseWeekday(episodes);
        expect(weekday).toBe(3); // Wednesday (most common)
      } finally {
        // Restore original method
        Date.prototype.getDay = originalGetDay;
      }
    });

    it('should handle episodes with missing release dates', () => {
      const episodes = [
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 1,
          title: 'Episode 1',
          plot: 'Plot 1',
          durationInMinutes: 45,
          releaseDate: '2024-03-20', // Wednesday
          poster: '/poster1.jpg'
        },
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 2,
          title: 'Episode 2',
          plot: 'Plot 2',
          durationInMinutes: 50,
          releaseDate: '2024-03-27', // Wednesday
          poster: '/poster2.jpg'
        },
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 3,
          title: 'Episode 3',
          plot: 'Plot 3',
          durationInMinutes: 55,
          releaseDate: '', // Missing release date
          poster: '/poster3.jpg'
        }
      ];

      // Mock the getDay method to return fixed values for our test dates
      const originalGetDay = Date.prototype.getDay;
      Date.prototype.getDay = function() {
        const dateStr = this.toISOString().split('T')[0];
        switch(dateStr) {
          case '2024-03-20': return 3; // Wednesday
          case '2024-03-27': return 3; // Wednesday
          default: return originalGetDay.call(this);
        }
      };

      try {
        const weekday = (seasonCacheService as any).calculateReleaseWeekday(episodes);
        expect(weekday).toBe(3); // Wednesday (most common)
      } finally {
        // Restore original method
        Date.prototype.getDay = originalGetDay;
      }
    });
  });

  describe('calculateNextEpisodeDate', () => {
    it('should return undefined if no future episodes', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const pastDateStr = pastDate.toISOString().split('T')[0];

      const episodes = [
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 1,
          title: 'Episode 1',
          plot: 'Plot 1',
          durationInMinutes: 45,
          releaseDate: pastDateStr,
          poster: '/poster1.jpg'
        }
      ];

      const nextDate = (seasonCacheService as any).calculateNextEpisodeDate(episodes);
      expect(nextDate).toBeUndefined();
    });

    it('should return the earliest future episode date', () => {
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 5);
      
      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 12);
      
      const episodes = [
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 1,
          title: 'Episode 1',
          plot: 'Plot 1',
          durationInMinutes: 45,
          releaseDate: futureDate2.toISOString().split('T')[0], // Later date
          poster: '/poster1.jpg'
        },
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 2,
          title: 'Episode 2',
          plot: 'Plot 2',
          durationInMinutes: 50,
          releaseDate: futureDate1.toISOString().split('T')[0], // Earlier date
          poster: '/poster2.jpg'
        }
      ];

      const nextDate = (seasonCacheService as any).calculateNextEpisodeDate(episodes);
      expect(nextDate?.toISOString().split('T')[0]).toEqual(futureDate1.toISOString().split('T')[0]);
    });

    it('should handle episodes with missing release dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const episodes = [
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 1,
          title: 'Episode 1',
          plot: 'Plot 1',
          durationInMinutes: 45,
          releaseDate: '', // Missing release date
          poster: '/poster1.jpg'
        },
        {
          _id: generateValidObjectId() as Types.ObjectId,
          episodeNumber: 2,
          title: 'Episode 2',
          plot: 'Plot 2',
          durationInMinutes: 50,
          releaseDate: futureDateStr,
          poster: '/poster2.jpg'
        }
      ];

      const nextDate = (seasonCacheService as any).calculateNextEpisodeDate(episodes);
      expect(nextDate?.toISOString().split('T')[0]).toEqual(futureDate.toISOString().split('T')[0]);
    });
  });

  describe('scheduleSeasonUpdates', () => {
    it('should stop existing job if one exists', () => {
      // Set up a mock job in the updateJobs map
      const mockJob = { stop: jest.fn() };
      (seasonCacheService as any).updateJobs.set(mockSeasonId.toString(), mockJob);

      // Call scheduleSeasonUpdates
      (seasonCacheService as any).scheduleSeasonUpdates(mockSeasonId.toString(), 'COMPLETED');

      // Check that the existing job was stopped
      expect(mockJob.stop).toHaveBeenCalled();
      expect((seasonCacheService as any).updateJobs.has(mockSeasonId.toString())).toBe(false);
    });

    it('should not create a job if policy has no schedule', () => {
      // COMPLETED status has no updateSchedule
      (seasonCacheService as any).scheduleSeasonUpdates(mockSeasonId.toString(), 'COMPLETED');
      
      // Verify no job was created
      expect((seasonCacheService as any).updateJobs.has(mockSeasonId.toString())).toBe(false);
    });
    it('should not create a job with a null updateJobs', () => {
      // COMPLETED status has no updateSchedule
      (seasonCacheService as any).updateJobs.set(mockSeasonId.toString(), null);
      (seasonCacheService as any).scheduleSeasonUpdates(mockSeasonId.toString(), 'COMPLETED');
      
      // Verify no job was created
      expect((seasonCacheService as any).updateJobs.has(mockSeasonId.toString())).toBe(false);
    });

    it('should create a new job if policy has schedule', () => {
      // ONGOING status has an updateSchedule
      const mockCronJob = jest.requireMock('cron').CronJob;
      
      (seasonCacheService as any).scheduleSeasonUpdates(mockSeasonId.toString(), 'ONGOING');
      
      // Verify a job was created with the right schedule
      expect(mockCronJob).toHaveBeenCalledWith(
        '0 0 * * *', // Schedule for ONGOING
        expect.any(Function)
      );
      expect((seasonCacheService as any).updateJobs.has(mockSeasonId.toString())).toBe(true);
    });

    it('should create scheduled job that calls updateSeasonData', async () => {
      // Mock the CronJob implementation to capture the callback
      let capturedCallback: Function = () => {};
      jest.requireMock('cron').CronJob.mockImplementation((schedule: string, callback: Function) => {
        capturedCallback = callback;
        return { start: jest.fn(), stop: jest.fn() };
      });

      // Set up mocks for the repository
      const mockSeasonData = { ...mockSeason };
      mockSeasonRepository.findById.mockResolvedValue(mockSeasonData);
      jest.spyOn(seasonCacheService, 'updateSeasonData').mockResolvedValue(true);

      // Create the scheduled job
      (seasonCacheService as any).scheduleSeasonUpdates(mockSeasonId.toString(), 'ONGOING');
      
      // Execute the captured callback
      await capturedCallback();
      
      // Verify the job fetched the season and called updateSeasonData
      expect(mockSeasonRepository.findById).toHaveBeenCalledWith(mockSeasonId.toString());
      expect(seasonCacheService.updateSeasonData).toHaveBeenCalledWith(mockSeasonData);
    });

    it('should stop and remove job if season is not found', async () => {
      // Mock the CronJob implementation to capture the callback
      let capturedCallback: Function = () => {};
      const mockStop = jest.fn();
      jest.requireMock('cron').CronJob.mockImplementation((schedule: string, callback: Function) => {
        capturedCallback = callback;
        return { start: jest.fn(), stop: mockStop };
      });

      // Set up mock to return null (season not found)
      mockSeasonRepository.findById.mockResolvedValue(null);
      
      // Create the scheduled job
      (seasonCacheService as any).scheduleSeasonUpdates(mockSeasonId.toString(), 'ONGOING');
      
      // Execute the captured callback
      await capturedCallback();
      
      // Verify the job was stopped and removed
      expect(mockStop).toHaveBeenCalled();
      expect((seasonCacheService as any).updateJobs.has(mockSeasonId.toString())).toBe(false);
    });
  });

  describe('initStateTransitionJob', () => {
    it('should create a weekly cron job that updates ONGOING and UPCOMING seasons', () => {
      // Reset the mock
      jest.clearAllMocks();
      
      // Get the CronJob constructor mock
      const mockCronJob = jest.requireMock('cron').CronJob;
      
      // Create a new service instance to trigger the constructor
      const newService = new SeasonCacheService(mockSeasonRepository, mockTMDBService);
      
      // Verify the job was created with the right schedule
      expect(mockCronJob).toHaveBeenNthCalledWith(
        1, // Primeira chamada
        '0 0 * * 0', // Every Sunday at midnight
        expect.any(Function),
      );
      
      // Verify start was called
      expect(mockCronJob.mock.results[0].value.start).toHaveBeenCalled();
    });
    
    it('should update all ONGOING and UPCOMING seasons when executed', async () => {
      // Mock the callback execution
      let capturedCallback: Function = () => {};
      jest.requireMock('cron').CronJob.mockImplementation((schedule: string, callback: Function) => {
        if (schedule === '0 0 * * 0') { // Match the state transition job schedule
          capturedCallback = callback;
        }
        return { start: jest.fn(), stop: jest.fn() };
      });
      
      // Setup mock data and responses
      const mockOngoingSeason = { ...mockSeason, status: 'ONGOING' as SeasonStatus };
      const mockUpcomingSeason = { ...mockSeason, status: 'UPCOMING' as SeasonStatus, _id: generateValidObjectId() as Types.ObjectId };
      mockSeasonRepository.findByStatus.mockResolvedValue([mockOngoingSeason, mockUpcomingSeason]);
      
      // Create a new service to setup the job
      const newService = new SeasonCacheService(mockSeasonRepository, mockTMDBService);
      jest.spyOn(newService, 'updateSeasonData').mockResolvedValue(true);
      
      // Execute the captured callback
      await capturedCallback();
      
      // Verify it fetched the correct seasons
      expect(mockSeasonRepository.findByStatus).toHaveBeenCalledWith(['ONGOING', 'UPCOMING']);
      
      // Verify it called updateSeasonData for each season
      expect(newService.updateSeasonData).toHaveBeenCalledTimes(2);
      expect(newService.updateSeasonData).toHaveBeenCalledWith(mockOngoingSeason);
      expect(newService.updateSeasonData).toHaveBeenCalledWith(mockUpcomingSeason);
    });
    
    it('should log error if finding seasons fails', async () => {
      // Mock the callback execution
      let capturedCallback: Function = () => {};
      jest.requireMock('cron').CronJob.mockImplementation((schedule: string, callback: Function) => {
        if (schedule === '0 0 * * 0') { // Match the state transition job schedule
          capturedCallback = callback;
        }
        return { start: jest.fn(), stop: jest.fn() };
      });
      
      // Set up mock to throw an error
      const mockError = new Error('Failed to fetch seasons');
      mockSeasonRepository.findByStatus.mockRejectedValue(mockError);
      
      // Create a new service to setup the job
      const newService = new SeasonCacheService(mockSeasonRepository, mockTMDBService);
      
      // Execute the captured callback (should not throw)
      await capturedCallback();
      
      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error in state transition job',
          error: mockError.message
        })
      );
    });
  });
  
  describe('initPopularSeriesJob', () => {
    it('should create a daily cron job that runs at 2 AM', () => {
      // Reset the mock
      jest.clearAllMocks();
      
      // Get the CronJob constructor mock
      const mockCronJob = jest.requireMock('cron').CronJob;
      
      // Create a new service instance to trigger the constructor
      const newService = new SeasonCacheService(mockSeasonRepository, mockTMDBService);
      
      // Verify the job was created with the right schedule
      expect(mockCronJob).toHaveBeenNthCalledWith(
        2, // Segunda chamada
        '0 2 * * *', // Every day at 2 AM
        expect.any(Function),
      );
      
      // Verify start was called
      expect(mockCronJob.mock.results[1].value.start).toHaveBeenCalled();
    });
    
    it('should update popular seasons to SPECIAL_INTEREST when executed', async () => {
      // Mock the callback execution
      let capturedCallback: Function = () => {};
      jest.requireMock('cron').CronJob.mockImplementation((schedule: string, callback: Function) => {
        if (schedule === '0 2 * * *') { // Match the popular series job schedule
          capturedCallback = callback;
        }
        return { start: jest.fn(), stop: jest.fn() };
      });
      
      // Setup mock data and responses
      const popularSeason1 = { 
        ...mockSeason, 
        status: 'ONGOING' as SeasonStatus, 
        accessCount: 15 
      };
      const popularSeason2 = { 
        ...mockSeason, 
        _id: generateValidObjectId() as Types.ObjectId, 
        status: 'COMPLETED' as SeasonStatus, 
        accessCount: 20 
      };
      
      mockSeasonRepository.findPopularSeasons.mockResolvedValue([popularSeason1, popularSeason2]);
      
      // Create a new service to setup the job
      const newService = new SeasonCacheService(mockSeasonRepository, mockTMDBService);
      
      // Execute the captured callback
      await capturedCallback();
      
      // Verify it fetched the popular seasons
      expect(mockSeasonRepository.findPopularSeasons).toHaveBeenCalled();
      
      // Verify it updated the status of each popular season
      expect(mockSeasonRepository.update).toHaveBeenCalledTimes(2);
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        popularSeason1._id,
        { status: 'SPECIAL_INTEREST' }
      );
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        popularSeason2._id,
        { status: 'SPECIAL_INTEREST' }
      );
    });
    
    it('should not update seasons that are already SPECIAL_INTEREST', async () => {
      // Mock the callback execution
      let capturedCallback: Function = () => {};
      jest.requireMock('cron').CronJob.mockImplementation((schedule: string, callback: Function) => {
        if (schedule === '0 2 * * *') { // Match the popular series job schedule
          capturedCallback = callback;
        }
        return { start: jest.fn(), stop: jest.fn() };
      });
      
      // Setup mock data with a season already marked as SPECIAL_INTEREST
      const popularSeason1 = { 
        ...mockSeason, 
        status: 'SPECIAL_INTEREST' as SeasonStatus, 
        accessCount: 15 
      };
      const popularSeason2 = { 
        ...mockSeason, 
        _id: generateValidObjectId() as Types.ObjectId, 
        status: 'ONGOING' as SeasonStatus, 
        accessCount: 20 
      };
      
      mockSeasonRepository.findPopularSeasons.mockResolvedValue([popularSeason1, popularSeason2]);
      
      // Create a new service to setup the job
      const newService = new SeasonCacheService(mockSeasonRepository, mockTMDBService);
      
      // Reset the mock counter
      mockSeasonRepository.update.mockClear();
      
      // Execute the captured callback
      await capturedCallback();
      
      // Verify it only updated the non-SPECIAL_INTEREST season
      expect(mockSeasonRepository.update).toHaveBeenCalledTimes(1);
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        popularSeason2._id,
        { status: 'SPECIAL_INTEREST' }
      );
    });
    
    it('should log error if finding popular seasons fails', async () => {
      // Mock the callback execution
      let capturedCallback: Function = () => {};
      jest.requireMock('cron').CronJob.mockImplementation((schedule: string, callback: Function) => {
        if (schedule === '0 2 * * *') { // Match the popular series job schedule
          capturedCallback = callback;
        }
        return { start: jest.fn(), stop: jest.fn() };
      });
      
      // Set up mock to throw an error
      const mockError = new Error('Failed to fetch popular seasons');
      mockSeasonRepository.findPopularSeasons.mockRejectedValue(mockError);
      
      // Create a new service to setup the job
      const newService = new SeasonCacheService(mockSeasonRepository, mockTMDBService);
      
      // Execute the captured callback (should not throw)
      await capturedCallback();
      
      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error in popular series job',
          error: mockError.message
        })
      );
    });
  });
}); 
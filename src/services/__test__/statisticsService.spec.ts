import { Types } from "mongoose";
import { ContentService } from "../commonService";
import { StatisticsService } from "../statisticsService";
import { IContentResponse } from "../../interfaces/content";
import { IUserStreamingHistoryResponse } from "../../interfaces/userStreamingHistory";
import { generateValidObjectId } from "../../util/__tests__/generateValidObjectId";

describe('StatisticsService', () => {
  let statisticsService: StatisticsService;
  let mockContentService: jest.Mocked<ContentService>;

  const mockContentId = generateValidObjectId() as Types.ObjectId;
  const mockContent: Partial<IContentResponse> = {
    _id: mockContentId,
    title: 'Test Content',
    genre: [{
      _id: generateValidObjectId(),
      name: 'Action',
      id: 1
    }]
  };

  const mockUserHistory: IUserStreamingHistoryResponse = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    totalWatchTimeInMinutes: 120,
    watchHistory: [
      {
        contentId: mockContentId,
        contentType: 'movie',
        title: 'Test Movie',
        watchedAt: new Date('2024-03-20'),
        watchedDurationInMinutes: 60,
        completionPercentage: 100
      },
      {
        contentId: mockContentId,
        contentType: 'series',
        title: 'Test Series',
        watchedAt: new Date('2024-03-20'),
        watchedDurationInMinutes: 60,
        completionPercentage: 20,
        seriesProgress: new Map([
          [mockContentId.toString(), {
            totalEpisodes: 10,
            watchedEpisodes: 2,
            completed: false,
            episodesWatched: new Map([
              ['episode1', {
                episodeId: 'episode1',
                seasonNumber: 1,
                episodeNumber: 1,
                watchedAt: new Date('2024-03-20'),
                watchedDurationInMinutes: 30,
                completionPercentage: 100
              }],
              ['episode2', {
                episodeId: 'episode2',
                seasonNumber: 1,
                episodeNumber: 2,
                watchedAt: new Date('2024-03-20'),
                watchedDurationInMinutes: 30,
                completionPercentage: 100
              }]
            ])
          }]
        ])
      }
    ],
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20')
  };

  beforeEach(() => {
    mockContentService = {
      getContentById: jest.fn()
    } as unknown as jest.Mocked<ContentService>;

    statisticsService = new StatisticsService(mockContentService);
  });

  describe('getWatchTimeStats', () => {
    it('should calculate watch time statistics', () => {
      const result = statisticsService.getWatchTimeStats(mockUserHistory);

      expect(result).toEqual({
        totalWatchTimeInMinutes: 120,
        averageWatchTimePerDay: 120,
        averageWatchTimePerSession: 60,
        watchTimeByContentType: {
          movie: 60,
          series: 60
        }
      });
    });

    it('should calculate watch time statistics with undefined content type', () => {
      const mockUserHistoryWithUndefinedContentType = {
        ...mockUserHistory,
        watchHistory: mockUserHistory.watchHistory.map(item => ({
          ...item,
          contentType: undefined,
          watchedDurationInMinutes: undefined
        }))
      } as unknown as IUserStreamingHistoryResponse;
      const result = statisticsService.getWatchTimeStats(mockUserHistoryWithUndefinedContentType);

      expect(result).toEqual({
        totalWatchTimeInMinutes: 120,
        averageWatchTimePerDay: 120,
        averageWatchTimePerSession: 60,
        watchTimeByContentType: {
          unknown: 0
        }
      });
    });

    it('should handle empty watch history', () => {
      const emptyHistory = {
        ...mockUserHistory,
        watchHistory: []
      };

      const result = statisticsService.getWatchTimeStats(emptyHistory);

      expect(result).toEqual({
        totalWatchTimeInMinutes: 120,
        averageWatchTimePerDay: 0,
        averageWatchTimePerSession: 0,
        watchTimeByContentType: {},
      });
    });

    it('should handle null watch history', () => {
      const emptyHistory = {
        ...mockUserHistory,
        totalWatchTimeInMinutes: 0,
        watchHistory: null
      } as unknown as IUserStreamingHistoryResponse;

      const result = statisticsService.getWatchTimeStats(emptyHistory);

      expect(result).toEqual({
        totalWatchTimeInMinutes: 0,
        averageWatchTimePerDay: 0,
        averageWatchTimePerSession: 0,
        watchTimeByContentType: {},
      });
    });
  });

  describe('getContentTypeDistribution', () => {
    it('should calculate content type distribution', () => {
      const result = statisticsService.getContentTypeDistribution(mockUserHistory);

      expect(result).toEqual({
        totalContent: 2,
        byType: {
          movie: 1,
          series: 1
        },
        percentageByType: {
          movie: 50,
          series: 50
        }
      });
    });

    it('should calculate content type distribution with undefined content type', () => {
      const mockUserHistoryWithUndefinedContentType = {
        ...mockUserHistory,
        watchHistory: mockUserHistory.watchHistory.map(item => ({
          ...item,
          contentType: undefined
        }))
      } as unknown as IUserStreamingHistoryResponse;
      const result = statisticsService.getContentTypeDistribution(mockUserHistoryWithUndefinedContentType);
      expect(result).toEqual({
        totalContent: 2,
        byType: {
          unknown: 2
        },
        percentageByType: {
          unknown: 100
        }
      });
    });

    it('should handle empty watch history', () => {
      const emptyHistory = {
        ...mockUserHistory,
        watchHistory: []
      };

      const result = statisticsService.getContentTypeDistribution(emptyHistory);

      expect(result).toEqual({
        totalContent: 0,
        byType: {},
        percentageByType: {}
      });
    });

    it('should handle null watch history', () => {
      const emptyHistory = {
        ...mockUserHistory,
        watchHistory: null
      } as unknown as IUserStreamingHistoryResponse;

      const result = statisticsService.getContentTypeDistribution(emptyHistory);

      expect(result).toEqual({
        totalContent: 0,
        byType: {},
        percentageByType: {}
      });
    });
  });

  describe('getGenrePreferences', () => {
    it('should calculate genre preferences', async () => {
      mockContentService.getContentById.mockResolvedValue(mockContent as IContentResponse);

      const result = await statisticsService.getGenrePreferences(mockUserHistory);

      expect(result).toEqual({
        genreCounts: {
          'Action': 2
        },
        genrePercentages: {
          'Action': 100
        },
        topGenres: [{
          genre: 'Action',
          count: 2,
          percentage: 100
        }],
        watchTimeByGenre: {
          'Action': 120
        },
        averageCompletionByGenre: {
          'Action': 60
        }
      });
    });

    it('should calculate genre preferences with undefined content type', async () => {
      const mockContentWithTwoGenres = {
        ...mockContent,
        genre: [
          {
            _id: generateValidObjectId(),
            name: 'Action',
            id: 1
          },
          {
            _id: generateValidObjectId(),
            name: 'Adventure',
            id: 2
          }
        ]
      } as unknown as IContentResponse;
      mockContentService.getContentById.mockResolvedValue(mockContentWithTwoGenres);

      const mockUserHistoryZeroMinutes = {
        ...mockUserHistory,
        watchHistory: [
          ...mockUserHistory.watchHistory.map(item => ({
            ...item
          })),
          {
            contentId: mockContentId,
            contentType: 'movie',
            title: 'Test Movie 2',
            watchedAt: new Date('2024-03-20'),
            watchedDurationInMinutes: undefined,
            completionPercentage: undefined
          }
        ]
      } as unknown as IUserStreamingHistoryResponse;
      const result = await statisticsService.getGenrePreferences(mockUserHistoryZeroMinutes);

      expect(result).toEqual({
        genreCounts: {
          'Action': 3,
          'Adventure': 3
        },
        genrePercentages: {
          'Action': 50,
          'Adventure': 50
        },
        topGenres: [{
          genre: 'Action',
          count: 3,
          percentage: 50
        },
        {
          genre: 'Adventure',
          count: 3,
          percentage: 50
        }],
        watchTimeByGenre: {
          'Action': 120,
          'Adventure': 120
        },
        averageCompletionByGenre: {
          'Action': 40,
          'Adventure': 40
        }
      });
    });

    it('should calculate genre preferences with undefined genre', async () => {
      mockContentService.getContentById.mockResolvedValue(null);

      const mockUserHistoryZeroMinutes = {
        ...mockUserHistory,
        watchHistory: [
          ...mockUserHistory.watchHistory.map(item => ({
            ...item
          })),
          {
            contentId: mockContentId,
            contentType: 'movie',
            title: 'Test Movie 2',
            watchedAt: new Date('2024-03-20'),
            watchedDurationInMinutes: undefined,
            completionPercentage: undefined
          }
        ]
      } as unknown as IUserStreamingHistoryResponse;
      const result = await statisticsService.getGenrePreferences(mockUserHistoryZeroMinutes);

      expect(result).toEqual({
        genreCounts: {
          unknown: 3
        },
        genrePercentages: {
          unknown: 100
        },
        topGenres: [{
          genre: 'unknown',
          count: 3,
          percentage: 100
        }],
        watchTimeByGenre: {
          unknown: 120
        },
        averageCompletionByGenre: {
          unknown: 40
        }
      });
    });

    it('should handle empty watch history', async () => {
      const emptyHistory = {
        ...mockUserHistory,
        watchHistory: []
      };

      const result = await statisticsService.getGenrePreferences(emptyHistory);

      expect(result).toEqual({
        genreCounts: {},
        genrePercentages: {},
        topGenres: [],
        watchTimeByGenre: {},
        averageCompletionByGenre: {}
      });
    });

    it('should handle null watch history', async () => {
      const emptyHistory = {
        ...mockUserHistory,
        watchHistory: null
      } as unknown as IUserStreamingHistoryResponse;

      const result = await statisticsService.getGenrePreferences(emptyHistory);

      expect(result).toEqual({
        genreCounts: {},
        genrePercentages: {},
        topGenres: [],
        watchTimeByGenre: {},
        averageCompletionByGenre: {}
      });
    });
  });

  describe('getSeriesProgressStats', () => {
    it('should calculate series progress statistics', () => {
      const result = statisticsService.getSeriesProgressStats(mockUserHistory);

      expect(result).toEqual({
        series: [{
          title: 'Test Series',
          totalEpisodes: 10,
          watchedEpisodes: 2,
          completionPercentage: 20,
          totalWatchTimeInMinutes: 60,
          averageEpisodeLength: 30
        }],
        mostWatchedSeries: {
          title: 'Test Series',
          totalEpisodes: 10,
          watchedEpisodes: 2,
          completionPercentage: 20,
          totalWatchTimeInMinutes: 60,
          averageEpisodeLength: 30
        },
        leastWatchedSeries: {
          title: 'Test Series',
          totalEpisodes: 10,
          watchedEpisodes: 2,
          completionPercentage: 20,
          totalWatchTimeInMinutes: 60,
          averageEpisodeLength: 30
        },
        averageCompletionPercentage: 20
      });
    });

    it('should calculate series progress statistics with watched duration in minutes undefined', () => {
      const mockSeriesProgress = new Map([[mockContentId.toString(), {
        totalEpisodes: 10,
        watchedEpisodes: 2,
        completed: false,
        watchedDurationInMinutes: 0,
        episodesWatched: new Map([
          ['episode1', {
            episodeId: 'episode1',
            seasonNumber: 1,
            episodeNumber: 1,
            watchedAt: new Date('2024-03-20'),
            watchedDurationInMinutes: null,
            completionPercentage: 100
          }],
          ['episode2', {
            episodeId: 'episode2',
            seasonNumber: 1,
            episodeNumber: 2,
            watchedAt: new Date('2024-03-20'),
            watchedDurationInMinutes: null,
            completionPercentage: 100
          }]
        ])
      }]])
      const mockUserHistoryWithUndefinedWatchedDuration = {
        ...mockUserHistory,
        watchHistory: mockUserHistory.watchHistory.map(item => ({
          ...item,
          seriesProgress: mockSeriesProgress
        }))
      } as unknown as IUserStreamingHistoryResponse;
      const result = statisticsService.getSeriesProgressStats(mockUserHistoryWithUndefinedWatchedDuration);

      expect(result).toEqual({
        series: [{
          title: 'Test Series',
          totalEpisodes: 10,
          watchedEpisodes: 2,
          completionPercentage: 20,
          totalWatchTimeInMinutes: 0,
          averageEpisodeLength: 0
        }],
        mostWatchedSeries: {
          title: 'Test Series',
          totalEpisodes: 10,
          watchedEpisodes: 2,
          completionPercentage: 20,
          totalWatchTimeInMinutes: 0,
          averageEpisodeLength: 0
        },
        leastWatchedSeries: {
          title: 'Test Series',
          totalEpisodes: 10,
          watchedEpisodes: 2,
          completionPercentage: 20,
          totalWatchTimeInMinutes: 0,
          averageEpisodeLength: 0
        },
        averageCompletionPercentage: 20
      });
    });
    
    it('should calculate series progress statistics with undefined series progress', () => {
      const mockUserHistoryWithUndefinedSeriesProgress = {
        ...mockUserHistory,
        watchHistory: mockUserHistory.watchHistory.map(item => ({
          ...item,
          seriesProgress: undefined
        }))
      } as unknown as IUserStreamingHistoryResponse;
      const result = statisticsService.getSeriesProgressStats(mockUserHistoryWithUndefinedSeriesProgress);

      expect(result).toEqual({
        series: [{
          title: 'Test Series',
          totalEpisodes: 0,
          watchedEpisodes: 0,
          completionPercentage: 0,
          totalWatchTimeInMinutes: 0,
          averageEpisodeLength: 0
        }],
        mostWatchedSeries: {
          title: 'Test Series',
          totalEpisodes: 0,
          watchedEpisodes: 0,
          completionPercentage: 0,
          totalWatchTimeInMinutes: 0,
          averageEpisodeLength: 0
        },
        leastWatchedSeries: {
          title: 'Test Series',
          totalEpisodes: 0,
          watchedEpisodes: 0,
          completionPercentage: 0,
          totalWatchTimeInMinutes: 0,
          averageEpisodeLength: 0
        },
        averageCompletionPercentage: 0
      });
    });

    it('should handle empty watch history', () => {
      const emptyHistory = {
        ...mockUserHistory,
        watchHistory: []
      };

      const result = statisticsService.getSeriesProgressStats(emptyHistory);

      expect(result).toEqual({
        series: [],
        mostWatchedSeries: undefined,
        leastWatchedSeries: undefined,
        averageCompletionPercentage: 0
      });
    });

    it('should handle null watch history', () => {
      const emptyHistory = {
        ...mockUserHistory,
        watchHistory: null
      } as unknown as IUserStreamingHistoryResponse;

      const result = statisticsService.getSeriesProgressStats(emptyHistory);

      expect(result).toEqual({
        series: [],
        mostWatchedSeries: undefined,
        leastWatchedSeries: undefined,
        averageCompletionPercentage: 0
      });
    });
  });

  describe('getWatchingPatterns', () => {
    it('should calculate watching patterns', () => {
      const result = statisticsService.getWatchingPatterns(mockUserHistory);

      expect(result).toEqual({
        mostActiveDate: new Date('2024-03-20'),
        mostActiveDay: 'Quarta',
        mostActiveHour: new Date('2024-03-20').getHours(),
        watchCountByDay: {
          'Quarta': 3
        },
        watchCountByHour: {
          [new Date('2024-03-20').getHours()]: 3
        },
        averageTimeBetweenEpisodes: 0
      });
    });

    it('should handle empty watch history', () => {
      const emptyHistory = {
        ...mockUserHistory,
        watchHistory: []
      };

      const result = statisticsService.getWatchingPatterns(emptyHistory);

      expect(result).toEqual({
        mostActiveDate: undefined,
        mostActiveDay: undefined,
        mostActiveHour: 0,
        watchCountByDay: {},
        watchCountByHour: {},
        averageTimeBetweenEpisodes: undefined
      });
    });

    it('should handle with undefined series progress', () => {
      const mockUserHistoryWithUndefinedSeriesProgress = {
        ...mockUserHistory,
        watchHistory: mockUserHistory.watchHistory.map(item => ({
          ...item,
          watchedAt: undefined,
          watchedDurationInMinutes: 0,
          completionPercentage: 0,
          seriesProgress: undefined
        }))
      } as unknown as IUserStreamingHistoryResponse;

        const result = statisticsService.getWatchingPatterns(mockUserHistoryWithUndefinedSeriesProgress);

      expect(result).toEqual({
        mostActiveDate: undefined,
        mostActiveDay: undefined,
        mostActiveHour: 0,
        watchCountByDay: {},
        watchCountByHour: {},
        averageTimeBetweenEpisodes: undefined
      });
    });
  });

  describe('getAllStats', () => {
    it('should return all statistics', async () => {
      mockContentService.getContentById.mockResolvedValue(mockContent as IContentResponse);

      const result = await statisticsService.getAllStats(mockUserHistory);

      expect(result).toEqual({
        watchTimeStats: {
          totalWatchTimeInMinutes: 120,
          averageWatchTimePerDay: 120,
          averageWatchTimePerSession: 60,
          watchTimeByContentType: {
            movie: 60,
            series: 60
          }
        },
        contentTypeDistribution: {
          totalContent: 2,
          byType: {
            movie: 1,
            series: 1
          },
          percentageByType: {
            movie: 50,
            series: 50
          }
        },
        seriesProgressStats: {
          series: [{
            title: 'Test Series',
            totalEpisodes: 10,
            watchedEpisodes: 2,
            completionPercentage: 20,
            totalWatchTimeInMinutes: 60,
            averageEpisodeLength: 30
          }],
          mostWatchedSeries: {
            title: 'Test Series',
            totalEpisodes: 10,
            watchedEpisodes: 2,
            completionPercentage: 20,
            totalWatchTimeInMinutes: 60,
            averageEpisodeLength: 30
          },
          leastWatchedSeries: {
            title: 'Test Series',
            totalEpisodes: 10,
            watchedEpisodes: 2,
            completionPercentage: 20,
            totalWatchTimeInMinutes: 60,
            averageEpisodeLength: 30
          },
          averageCompletionPercentage: 20
        },
        watchingPatternStats: {
          mostActiveDate: new Date('2024-03-20'),
          mostActiveDay: 'Quarta',
          mostActiveHour: new Date('2024-03-20').getHours(),
          watchCountByDay: {
            'Quarta': 3
          },
          watchCountByHour: {
            [new Date('2024-03-20').getHours()]: 3
          },
          averageTimeBetweenEpisodes: 0
        },
        genrePreferenceStats: {
          genreCounts: {
            'Action': 2
          },
          genrePercentages: {
            'Action': 100
          },
          topGenres: [{
            genre: 'Action',
            count: 2,
            percentage: 100
          }],
          watchTimeByGenre: {
            'Action': 120
          },
          averageCompletionByGenre: {
            'Action': 60
          }
        }
      });
    });
  });
}); 
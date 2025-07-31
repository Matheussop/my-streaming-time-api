import {
  WatchTimeStatsSchema,
  ContentTypeDistributionSchema,
  GenrePreferenceSchema,
  SeriesProgressItemSchema,
  SeriesProgressStatsSchema,
  WatchingPatternStatsSchema,
  UserWatchingStatsSchema
} from '../statistics';
import { z } from 'zod';

describe('Statistics Interfaces and Schemas', () => {
  describe('WatchTimeStatsSchema', () => {
    it('should validate valid watch time statistics data', () => {
      const validWatchTimeStats = {
        totalWatchTimeInMinutes: 1200,
        averageWatchTimePerDay: 60,
        averageWatchTimePerSession: 30,
        watchTimeByContentType: {
          'series': 800,
          'movie': 400
        }
      };

      expect(() => WatchTimeStatsSchema.parse(validWatchTimeStats)).not.toThrow();
    });

    it('should reject invalid watch time statistics data', () => {
      const invalidWatchTimeStats = {
        totalWatchTimeInMinutes: '1200', 
        averageWatchTimePerDay: 60,
        averageWatchTimePerSession: 30,
        watchTimeByContentType: {
          'series': 800,
          'movie': 400
        }
      };

      expect(() => WatchTimeStatsSchema.parse(invalidWatchTimeStats)).toThrow(z.ZodError);
    });

    it('should reject when required fields are missing', () => {
      const incompleteWatchTimeStats = {
        totalWatchTimeInMinutes: 1200,
        averageWatchTimePerSession: 30,
        watchTimeByContentType: {
          'series': 800,
          'movie': 400
        }
      };

      expect(() => WatchTimeStatsSchema.parse(incompleteWatchTimeStats)).toThrow(z.ZodError);
    });
  });

  describe('ContentTypeDistributionSchema', () => {
    it('should validate valid content type distribution data', () => {
      const validContentTypeDistribution = {
        totalContent: 50,
        byType: {
          'series': 30,
          'movie': 20
        },
        percentageByType: {
          'series': 60,
          'movie': 40
        }
      };

      expect(() => ContentTypeDistributionSchema.parse(validContentTypeDistribution)).not.toThrow();
    });

    it('should reject invalid content type distribution data', () => {
      const invalidContentTypeDistribution = {
        totalContent: 50,
        byType: {
          'series': 30,
          'movie': 'twenty' // Should be a number
        },
        percentageByType: {
          'series': 60,
          'movie': 40
        }
      };

      expect(() => ContentTypeDistributionSchema.parse(invalidContentTypeDistribution)).toThrow(z.ZodError);
    });
  });

  describe('GenrePreferenceSchema', () => {
    it('should validate valid genre preference data', () => {
      const validGenrePreference = {
        genreCounts: {
          'action': 20,
          'comedy': 15,
          'drama': 10
        },
        genrePercentages: {
          'action': 44.4,
          'comedy': 33.3,
          'drama': 22.3
        },
        topGenres: [
          { genre: 'action', count: 20, percentage: 44.4 },
          { genre: 'comedy', count: 15, percentage: 33.3 },
          { genre: 'drama', count: 10, percentage: 22.3 }
        ],
        watchTimeByGenre: {
          'action': 500,
          'comedy': 300,
          'drama': 200
        },
        averageCompletionByGenre: {
          'action': 85,
          'comedy': 90,
          'drama': 70
        }
      };

      expect(() => GenrePreferenceSchema.parse(validGenrePreference)).not.toThrow();
    });

    it('should validate valid data even without optional fields', () => {
      const validGenrePreferenceWithoutOptionals = {
        genreCounts: {
          'action': 20,
          'comedy': 15,
          'drama': 10
        },
        genrePercentages: {
          'action': 44.4,
          'comedy': 33.3,
          'drama': 22.3
        },
        topGenres: [
          { genre: 'action', count: 20, percentage: 44.4 },
          { genre: 'comedy', count: 15, percentage: 33.3 },
          { genre: 'drama', count: 10, percentage: 22.3 }
        ]
      };

      expect(() => GenrePreferenceSchema.parse(validGenrePreferenceWithoutOptionals)).not.toThrow();
    });

    it('should reject invalid genre preference data', () => {
      const invalidGenrePreference = {
        genreCounts: {
          'action': 20,
          'comedy': 15,
          'drama': 10
        },
        genrePercentages: {
          'action': 44.4,
          'comedy': 33.3,
          'drama': 22.3
        },
        topGenres: [
          { genre: 'action', count: '20', percentage: 44.4 }, // count should be a number
          { genre: 'comedy', count: 15, percentage: 33.3 },
          { genre: 'drama', count: 10, percentage: 22.3 }
        ]
      };

      expect(() => GenrePreferenceSchema.parse(invalidGenrePreference)).toThrow(z.ZodError);
    });
  });

  describe('SeriesProgressItemSchema', () => {
    it('should validate valid series progress item data', () => {
      const validSeriesProgressItem = {
        title: 'Breaking Bad',
        totalEpisodes: 62,
        watchedEpisodes: 45,
        completionPercentage: 72.58,
        totalWatchTimeInMinutes: 2700,
        averageEpisodeLength: 60
      };

      expect(() => SeriesProgressItemSchema.parse(validSeriesProgressItem)).not.toThrow();
    });

    it('should reject invalid series progress item data', () => {
      const invalidSeriesProgressItem = {
        title: 'Breaking Bad',
        totalEpisodes: 62,
        watchedEpisodes: 45,
        completionPercentage: '72.58', // Should be a number
        totalWatchTimeInMinutes: 2700,
        averageEpisodeLength: 60
      };

      expect(() => SeriesProgressItemSchema.parse(invalidSeriesProgressItem)).toThrow(z.ZodError);
    });
  });

  describe('SeriesProgressStatsSchema', () => {
    it('should validate valid series progress statistics data', () => {
      const validSeriesProgressStats = {
        series: [
          {
            title: 'Breaking Bad',
            totalEpisodes: 62,
            watchedEpisodes: 45,
            completionPercentage: 72.58,
            totalWatchTimeInMinutes: 2700,
            averageEpisodeLength: 60
          },
          {
            title: 'Game of Thrones',
            totalEpisodes: 73,
            watchedEpisodes: 73,
            completionPercentage: 100,
            totalWatchTimeInMinutes: 4380,
            averageEpisodeLength: 60
          }
        ],
        mostWatchedSeries: {
          title: 'Game of Thrones',
          totalEpisodes: 73,
          watchedEpisodes: 73,
          completionPercentage: 100,
          totalWatchTimeInMinutes: 4380,
          averageEpisodeLength: 60
        },
        leastWatchedSeries: {
          title: 'Breaking Bad',
          totalEpisodes: 62,
          watchedEpisodes: 45,
          completionPercentage: 72.58,
          totalWatchTimeInMinutes: 2700,
          averageEpisodeLength: 60
        },
        averageCompletionPercentage: 86.29
      };

      expect(() => SeriesProgressStatsSchema.parse(validSeriesProgressStats)).not.toThrow();
    });

    it('should validate valid data even without optional fields', () => {
      const validSeriesProgressStatsWithoutOptionals = {
        series: [
          {
            title: 'Breaking Bad',
            totalEpisodes: 62,
            watchedEpisodes: 45,
            completionPercentage: 72.58,
            totalWatchTimeInMinutes: 2700,
            averageEpisodeLength: 60
          }
        ],
        averageCompletionPercentage: 72.58
      };

      expect(() => SeriesProgressStatsSchema.parse(validSeriesProgressStatsWithoutOptionals)).not.toThrow();
    });

    it('should handle empty series array in series progress stats', () => {
      const seriesProgressStatsWithEmptyArray = {
        series: [], // Empty array
        averageCompletionPercentage: 0
      };

      // Doesn't throw because the schema doesn't require array with elements
      expect(() => SeriesProgressStatsSchema.parse(seriesProgressStatsWithEmptyArray)).not.toThrow();
    });
  });

  describe('WatchingPatternStatsSchema', () => {
    it('should validate valid watching pattern statistics', () => {
      const validWatchingPatternStats = {
        mostActiveDate: new Date('2023-01-15'),
        mostActiveDay: 'Sunday',
        mostActiveHour: 20,
        watchCountByDay: {
          'Monday': 5,
          'Tuesday': 3,
          'Wednesday': 6,
          'Thursday': 4,
          'Friday': 8,
          'Saturday': 10,
          'Sunday': 12
        },
        watchCountByHour: {
          '18': 4,
          '19': 8,
          '20': 15,
          '21': 10,
          '22': 6
        },
        averageTimeBetweenEpisodes: 1440 // minutes (24 hours)
      };

      expect(() => WatchingPatternStatsSchema.parse(validWatchingPatternStats)).not.toThrow();
    });

    it('should validate valid data even without optional fields', () => {
      const validWatchingPatternStatsWithoutOptionals = {
        watchCountByDay: {
          'Monday': 5,
          'Tuesday': 3,
          'Wednesday': 6,
          'Thursday': 4,
          'Friday': 8,
          'Saturday': 10,
          'Sunday': 12
        },
        watchCountByHour: {
          '18': 4,
          '19': 8,
          '20': 15,
          '21': 10,
          '22': 6
        }
      };

      expect(() => WatchingPatternStatsSchema.parse(validWatchingPatternStatsWithoutOptionals)).not.toThrow();
    });

    it('should reject invalid watching pattern statistics', () => {
      const invalidWatchingPatternStats = {
        mostActiveDate: '2023-01-15', // Should be a Date object
        mostActiveDay: 'Sunday',
        mostActiveHour: 20,
        watchCountByDay: {
          'Monday': 5,
          'Tuesday': 3
        },
        watchCountByHour: {
          '18': 4,
          '19': 8
        }
      };

      expect(() => WatchingPatternStatsSchema.parse(invalidWatchingPatternStats)).toThrow(z.ZodError);
    });
  });

  describe('UserWatchingStatsSchema', () => {
    it('should validate valid complete user watching statistics', () => {
      const validUserWatchingStats = {
        watchTimeStats: {
          totalWatchTimeInMinutes: 7080,
          averageWatchTimePerDay: 60,
          averageWatchTimePerSession: 45,
          watchTimeByContentType: {
            'series': 6000,
            'movie': 1080
          }
        },
        contentTypeDistribution: {
          totalContent: 50,
          byType: {
            'series': 30,
            'movie': 20
          },
          percentageByType: {
            'series': 60,
            'movie': 40
          }
        },
        seriesProgressStats: {
          series: [
            {
              title: 'Breaking Bad',
              totalEpisodes: 62,
              watchedEpisodes: 45,
              completionPercentage: 72.58,
              totalWatchTimeInMinutes: 2700,
              averageEpisodeLength: 60
            },
            {
              title: 'Game of Thrones',
              totalEpisodes: 73,
              watchedEpisodes: 73,
              completionPercentage: 100,
              totalWatchTimeInMinutes: 4380,
              averageEpisodeLength: 60
            }
          ],
          mostWatchedSeries: {
            title: 'Game of Thrones',
            totalEpisodes: 73,
            watchedEpisodes: 73,
            completionPercentage: 100,
            totalWatchTimeInMinutes: 4380,
            averageEpisodeLength: 60
          },
          leastWatchedSeries: {
            title: 'Breaking Bad',
            totalEpisodes: 62,
            watchedEpisodes: 45,
            completionPercentage: 72.58,
            totalWatchTimeInMinutes: 2700,
            averageEpisodeLength: 60
          },
          averageCompletionPercentage: 86.29
        },
        watchingPatternStats: {
          mostActiveDate: new Date('2023-01-15'),
          mostActiveDay: 'Sunday',
          mostActiveHour: 20,
          watchCountByDay: {
            'Monday': 5,
            'Tuesday': 3,
            'Wednesday': 6,
            'Thursday': 4,
            'Friday': 8,
            'Saturday': 10,
            'Sunday': 12
          },
          watchCountByHour: {
            '18': 4,
            '19': 8,
            '20': 15,
            '21': 10,
            '22': 6
          },
          averageTimeBetweenEpisodes: 1440
        },
        genrePreferenceStats: {
          genreCounts: {
            'action': 20,
            'comedy': 15,
            'drama': 10
          },
          genrePercentages: {
            'action': 44.4,
            'comedy': 33.3,
            'drama': 22.3
          },
          topGenres: [
            { genre: 'action', count: 20, percentage: 44.4 },
            { genre: 'comedy', count: 15, percentage: 33.3 },
            { genre: 'drama', count: 10, percentage: 22.3 }
          ]
        }
      };

      expect(() => UserWatchingStatsSchema.parse(validUserWatchingStats)).not.toThrow();
    });

    it('should validate valid data even without optional fields', () => {
      const validUserWatchingStatsWithoutOptionals = {
        watchTimeStats: {
          totalWatchTimeInMinutes: 7080,
          averageWatchTimePerDay: 60,
          averageWatchTimePerSession: 45,
          watchTimeByContentType: {
            'series': 6000,
            'movie': 1080
          }
        },
        contentTypeDistribution: {
          totalContent: 50,
          byType: {
            'series': 30,
            'movie': 20
          },
          percentageByType: {
            'series': 60,
            'movie': 40
          }
        },
        seriesProgressStats: {
          series: [
            {
              title: 'Breaking Bad',
              totalEpisodes: 62,
              watchedEpisodes: 45,
              completionPercentage: 72.58,
              totalWatchTimeInMinutes: 2700,
              averageEpisodeLength: 60
            }
          ],
          averageCompletionPercentage: 72.58
        },
        watchingPatternStats: {
          watchCountByDay: {
            'Monday': 5,
            'Tuesday': 3,
            'Wednesday': 6,
            'Thursday': 4,
            'Friday': 8,
            'Saturday': 10,
            'Sunday': 12
          },
          watchCountByHour: {
            '18': 4,
            '19': 8,
            '20': 15,
            '21': 10,
            '22': 6
          }
        }
      };

      expect(() => UserWatchingStatsSchema.parse(validUserWatchingStatsWithoutOptionals)).not.toThrow();
    });

    it('should reject invalid complete user watching statistics', () => {
      const invalidUserWatchingStats = {
        watchTimeStats: {
          totalWatchTimeInMinutes: 7080,
          averageWatchTimePerDay: 60,
          averageWatchTimePerSession: 45,
          watchTimeByContentType: {
            'series': 6000,
            'movie': 1080
          }
        },
        // contentTypeDistribution is missing (required)
        seriesProgressStats: {
          series: [
            {
              title: 'Breaking Bad',
              totalEpisodes: 62,
              watchedEpisodes: 45,
              completionPercentage: 72.58,
              totalWatchTimeInMinutes: 2700,
              averageEpisodeLength: 60
            }
          ],
          averageCompletionPercentage: 72.58
        },
        watchingPatternStats: {
          watchCountByDay: {
            'Monday': 5,
            'Tuesday': 3
          },
          watchCountByHour: {
            '18': 4,
            '19': 8
          }
        }
      };

      expect(() => UserWatchingStatsSchema.parse(invalidUserWatchingStats)).toThrow(z.ZodError);
    });
  });
}); 
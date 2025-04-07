import { z } from 'zod';

/**
 * Interface para estatísticas de tempo total de visualização
 */
export const WatchTimeStatsSchema = z.object({
  totalWatchTimeInMinutes: z.number(),
  averageWatchTimePerDay: z.number(),
  averageWatchTimePerSession: z.number(),
  watchTimeByContentType: z.record(z.string(), z.number()),
});

export type WatchTimeStats = z.infer<typeof WatchTimeStatsSchema>;

/**
 * Interface para estatísticas de distribuição de tipos de conteúdo
 */
export const ContentTypeDistributionSchema = z.object({
  totalContent: z.number(),
  byType: z.record(z.string(), z.number()),
  percentageByType: z.record(z.string(), z.number()),
});

export type ContentTypeDistribution = z.infer<typeof ContentTypeDistributionSchema>;

/**
 * Interface para estatísticas de preferências de gênero
 */
export const GenrePreferenceSchema = z.object({
  genreCounts: z.record(z.string(), z.number()),
  genrePercentages: z.record(z.string(), z.number()),
  topGenres: z.array(z.object({
    genre: z.string(),
    count: z.number(),
    percentage: z.number()
  })),
  watchTimeByGenre: z.record(z.string(), z.number()).optional(),
  averageCompletionByGenre: z.record(z.string(), z.number()).optional(),
});

export type GenrePreferenceStats = z.infer<typeof GenrePreferenceSchema>;

/**
 * Interface para estatísticas de progresso de séries
 */
export const SeriesProgressItemSchema = z.object({
  title: z.string(),
  totalEpisodes: z.number(),
  watchedEpisodes: z.number(),
  completionPercentage: z.number(),
  totalWatchTimeInMinutes: z.number(),
  averageEpisodeLength: z.number(),
});

export const SeriesProgressStatsSchema = z.object({
  series: z.array(SeriesProgressItemSchema),
  mostWatchedSeries: SeriesProgressItemSchema.optional(),
  leastWatchedSeries: SeriesProgressItemSchema.optional(),
  averageCompletionPercentage: z.number(),
});

export type SeriesProgressItem = z.infer<typeof SeriesProgressItemSchema>;
export type SeriesProgressStats = z.infer<typeof SeriesProgressStatsSchema>;

/**
 * Interface para estatísticas de padrões de visualização
 */
export const WatchingPatternStatsSchema = z.object({
  mostActiveDate: z.date().optional(),
  mostActiveDay: z.string().optional(),
  mostActiveHour: z.number().optional(),
  watchCountByDay: z.record(z.string(), z.number()),
  watchCountByHour: z.record(z.string(), z.number()),
  averageTimeBetweenEpisodes: z.number().optional(),
});

export type WatchingPatternStats = z.infer<typeof WatchingPatternStatsSchema>;

/**
 * Interface agregadora de todas as estatísticas
 */
export const UserWatchingStatsSchema = z.object({
  watchTimeStats: WatchTimeStatsSchema,
  contentTypeDistribution: ContentTypeDistributionSchema,
  seriesProgressStats: SeriesProgressStatsSchema,
  watchingPatternStats: WatchingPatternStatsSchema,
  genrePreferenceStats: GenrePreferenceSchema.optional(),
});

export type UserWatchingStats = z.infer<typeof UserWatchingStatsSchema>; 
import { z } from 'zod';
import { objectIdSchema } from './common';

const watchHistoryEntrySchema = z.object({
  contentId: objectIdSchema,
  contentType: z.enum(['movie', 'series']),
  title: z.string().min(1, { message: 'Title has to be at least 1 character long' }),
  episodeId: objectIdSchema.optional(),
  seasonNumber: z.number().optional(),
  episodeNumber: z.number().optional(),
  watchedAt: z.date().optional(),
  watchedDurationInMinutes: z.number().min(0, { message: 'Watched duration has to be at least 0 minutes' }),
  completionPercentage: z.number().min(0, { message: 'Completion percentage has to be at least 0%' }).max(100, { message: 'Completion percentage has to be at most 100%' }).optional(),
  rating: z.number().min(0, { message: 'Rating has to be at least 0' }).max(10, { message: 'Rating has to be at most 10' }).optional(),
});

export const userStreamingHistoryCreateSchema = z.object({
  userId: objectIdSchema,
  watchHistory: z.array(watchHistoryEntrySchema),
  totalWatchTimeInMinutes: z.number().min(0, { message: 'Total watch time has to be at least 0 minutes' }).optional(),
});

export type UserStreamingHistoryCreatePayload = z.infer<typeof userStreamingHistoryCreateSchema>;

export const userStreamingHistoryUpdateSchema = userStreamingHistoryCreateSchema.partial();

export type UserStreamingHistoryUpdatePayload = z.infer<typeof userStreamingHistoryUpdateSchema>;

export const userStreamingHistoryAddEntrySchema = watchHistoryEntrySchema.extend({
  userId: objectIdSchema,
});

export type UserStreamingHistoryAddEntryPayload = z.infer<typeof userStreamingHistoryAddEntrySchema>;

// Base schema for operations that require only userId and contentId
export const userContentIdentifierSchema = z.object({
  userId: objectIdSchema,
  contentId: objectIdSchema,
});

export const userStreamingHistoryRemoveEntrySchema = userContentIdentifierSchema;

export type UserStreamingHistoryRemoveEntryPayload = z.infer<typeof userStreamingHistoryRemoveEntrySchema>;

export const userStreamingHistoryGetByUserIdAndStreamingIdSchema = userContentIdentifierSchema;

export type UserStreamingHistoryGetByUserIdAndStreamingIdPayload = z.infer<typeof userStreamingHistoryGetByUserIdAndStreamingIdSchema>;

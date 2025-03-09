import { z } from 'zod';
import { objectIdSchema } from './common';

export const genreReferenceSchema = z.object({
  _id: objectIdSchema,
  id: z.number(),
  name: z.string(),
});

export const streamingTypeCreateSchema = z.object({
  name: z.string().min(1),
  supportedGenres: z.array(genreReferenceSchema).optional(),
  description: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type StreamingTypeCreatePayload = z.infer<typeof streamingTypeCreateSchema>;

export const streamingTypeUpdateSchema = streamingTypeCreateSchema.partial();

export type StreamingTypeUpdatePayload = z.infer<typeof streamingTypeUpdateSchema>;

export const streamingTypeByNameParamSchema = z.object({
  name: z.string().min(1),
});

export type StreamingTypeByNameParamSchemaType = z.infer<typeof streamingTypeByNameParamSchema>;

export const streamingTypeAddGenreSchema = z.object({
  supportedGenres: z.array(genreReferenceSchema),
});

export type StreamingTypeAddGenreSchemaType = z.infer<typeof streamingTypeAddGenreSchema>;





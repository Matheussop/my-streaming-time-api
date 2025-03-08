import { z } from 'zod';
import { objectIdSchema, dateSchema, paginationSchema } from './common';
import { IEpisode, ISeasonCreate, ISeasonUpdate } from '../interfaces/series/season';


export const episodeSchema = z.object({
  episodeNumber: z.number().int().positive(),
  title: z.string().min(1, { message: 'Título é obrigatório' }),
  plot: z.string(),
  durationInMinutes: z.number().int().positive(),
  releaseDate: dateSchema,
  poster: z.string().url({ message: 'Poster deve ser uma URL válida' })
});

export type EpisodeSchemaType = z.infer<typeof episodeSchema>;

export const seasonCreateSchema = z.object({
  seriesId: objectIdSchema,
  seasonNumber: z.number().int().positive(),
  title: z.string().min(1, { message: 'Título é obrigatório' }),
  plot: z.string(),
  releaseDate: dateSchema,
  poster: z.string().url({ message: 'Poster deve ser uma URL válida' }).optional(),
  episodes: z.array(episodeSchema).optional()
}).strict("Additional fields are not allowed");

export type SeasonCreateSchemaType = z.infer<typeof seasonCreateSchema>;

export const seasonUpdateSchema = z.object({
  seriesId: objectIdSchema,
  seasonNumber: z.number().int().positive().optional(),
  title: z.string().min(1, { message: 'Título é obrigatório' }).optional(),
  plot: z.string().optional(),
  releaseDate: dateSchema.optional(),
  poster: z.string().url({ message: 'Poster deve ser uma URL válida' }).optional(),
  episodes: z.array(episodeSchema.extend({
    _id: objectIdSchema.optional()
  })).optional()
}).strict("Additional fields are not allowed");

export type SeasonUpdateSchemaType = z.infer<typeof seasonUpdateSchema>;

export const seasonsBySeriesParamSchema = paginationSchema.extend({
  seriesId: objectIdSchema,
}); 

export type SeasonsBySeriesParamSchemaType = z.infer<typeof seasonsBySeriesParamSchema>;





import { z } from 'zod';
import { objectIdSchema, paginationSchema } from './common';
import { dateSchema } from './common';

export const commonMediaCreateSchema = z.object({
  title: z.string({
    required_error: "Title is required",  
    invalid_type_error: "Title must be text"
  }).min(2, "Title must have at least 2 characters"),
  releaseDate: dateSchema,
  plot: z.string({
    invalid_type_error: "Plot must be text"
  }).min(2, "Plot must have at least 2 characters").optional(),
  cast: z.array(z.string(), {
    invalid_type_error: "Cast must be an array"
  }).min(1, "Cast must have at least 1 character").optional(),
  rating: z.number({
    invalid_type_error: "Rating must be a number"
  }).min(0, "Rating must be equal or greater than 0").optional(),  
  genre: z.union([
    z.array(z.number({
      invalid_type_error: "Genre must be a number or an object of Genre with the following properties: _id, id, name"
    })).min(1, "At least one genre must be provided"),
    z.array(z.object({
      _id: objectIdSchema,
      id: z.number({
        invalid_type_error: "Genre ID must be a number"
      }),
      name: z.string({
        invalid_type_error: "Genre name must be text"
      }),
    }, {
      invalid_type_error: "Genre must be an array of numbers or objects of Genre"
    })).min(1, "At least one genre must be provided")
  ], {
    errorMap: () => ({ message: "Genre must be an array of numbers or objects of Genre" })
  }),
  status: z.string({
    invalid_type_error: "Status must be text"
  }).min(3, "Status must have at least 3 characters").optional(),
  tmdbId: z.number({
    invalid_type_error: "TMDB ID must be a number"
  }).optional(),
  poster: z.string({
    invalid_type_error: "Poster must be text"
  }).min(5, "Poster must have at least 5 characters").optional(),
  url: z.string({
    invalid_type_error: "URL must be text"
  }).min(5, "URL must have at least 5 characters").optional(),
  videoUrl: z.string().url({
    message: "Video URL must be a valid URL"
  }).optional()
});

export type CommonMediaCreatePayload = z.infer<typeof commonMediaCreateSchema>;

export const commonMediaUpdateSchema = commonMediaCreateSchema.partial();
export type CommonMediaUpdatePayload = z.infer<typeof commonMediaUpdateSchema>;

export const commonMediaByTitleParamSchema = paginationSchema.extend({
  title: z.string({
    invalid_type_error: "Title must be text",
    required_error: "Title is required"
  }).min(2, "Title must have at least 2 characters")
});

export type CommonMediaByTitleParamSchemaType = z.infer<typeof commonMediaByTitleParamSchema>;

export const commonMediaByGenreParamSchema = z.object({
  genre: z.string({
    invalid_type_error: "Genre must be text",
    required_error: "Genre is required"
  }).min(2, "Genre must have at least 2 characters")
});

export type CommonMediaByGenreParamSchemaType = z.infer<typeof commonMediaByGenreParamSchema>;

export const commonMediaUpdateFromTMDBSchema = z.object({
  id: objectIdSchema,
  tmdbId: z.number({
    invalid_type_error: "TMDB ID must be a number"
  })
});

export type CommonMediaUpdateFromTMDBSchemaType = z.infer<typeof commonMediaUpdateFromTMDBSchema>;

import { z } from "zod";
import { dateSchema, objectIdSchema, paginationSchema } from "./common";

export const seriesCreateSchema = z.object({
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
  totalEpisodes: z.number({
    required_error: "Total episodes is required",
    invalid_type_error: "Total episodes must be a number"
  }).min(1, "Total episodes must be equal or greater than 1"),
  totalSeasons: z.number({
    required_error: "Total seasons is required",
    invalid_type_error: "Total seasons must be a number"
  }).min(1, "Total seasons must be equal or greater than 1"),
  seasonsSummary: z.array(z.object({
    seasonId: objectIdSchema,
    seasonNumber: z.number({
      required_error: "Season number is required",
      invalid_type_error: "Season number must be a number and not empty"
    }),
    title: z.string({
      required_error: "Season title is required",
      invalid_type_error: "Season title must be text and not empty"
    }),
    episodeCount: z.number({
      required_error: "Episode count is required",
      invalid_type_error: "Episode count must be a number and not empty"
    }),
    releaseDate: dateSchema
  }, {
    invalid_type_error: "Seasons summary must be an array of ISeasonSummary objects with the following properties: seasonId, seasonNumber, title, episodeCount, releaseDate",
  })).optional(),
}).strict("Additional fields are not allowed");

export type SeriesCreatePayload = z.infer<typeof seriesCreateSchema>;

export const createManySeriesSchema = z.object({
  series: z.array(seriesCreateSchema,{
    required_error: "Series list is required",  
    invalid_type_error: "Series list must be an array"
  }).min(1, "At least one series must be provided")
});

export type CreateManySeriesPayload = z.infer<typeof createManySeriesSchema>;

export const updateSeriesSchema = seriesCreateSchema.extend({
  seasonId: objectIdSchema
}).partial();

export type UpdateSeriesPayload = z.infer<typeof updateSeriesSchema>;

export const seriesByTitleParamSchema = paginationSchema.extend({
  title: z.string({
    required_error: "Title is required",
    invalid_type_error: "Title must be text"
  }).min(2, "Title must have at least 2 characters")
});

export type SeriesByTitleParamSchemaType = z.infer<typeof seriesByTitleParamSchema>;

export const seriesByGenreParamSchema = paginationSchema.extend({
  genre: z.string({
    required_error: "Genre is required",
    invalid_type_error: "Genre must be text"
  }).min(2, "Genre must have at least 2 characters")
}).partial();

export type SeriesByGenreParamSchemaType = z.infer<typeof seriesByGenreParamSchema>;



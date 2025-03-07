import { Types } from "mongoose";
import { z } from "zod";

export const seriesSchema = z.object({
  title: z.string({
    required_error: "Title is required",  
    invalid_type_error: "Title must be text"
  }).min(2, "Title must have at least 2 characters"),
  releaseDate: z.string({
    required_error: "Release date is required",
    invalid_type_error: "Release date must be text and in the format YYYY-MM-DD"
  }).regex(/^\d{4}-\d{2}-\d{2}$/, "Release date must be in the format YYYY-MM-DD"),
    plot: z.string({
    invalid_type_error: "Plot must be text"
  }).min(2, "Plot must have at least 2 characters").optional(),
  cast: z.array(z.string(), {
    invalid_type_error: "Cast must be an array"
  }).min(1, "Cast must have at least 1 character").optional(),
  rating: z.number({
    invalid_type_error: "Rating must be a number"
  }).min(0, "Rating must be equal or greater than 0").optional(),  
  genre: z.array(z.number({
    invalid_type_error: "Genre must be a number"
  }) || z.object({
    _id: z.string({
      invalid_type_error: "Genre ID must be text"
    }),
    id: z.number({
      invalid_type_error: "Genre ID must be a number"
    }),
    name: z.string({
      invalid_type_error: "Genre name must be text"
    }),
  }, {
    invalid_type_error: "Genre must be an array of numbers or objects of Genre"
  })).min(1, "At least one genre must be provided"),
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
    seasonId: z.instanceof(Types.ObjectId).refine((val) => Types.ObjectId.isValid(val), {
      message: "Season ID must be a valid ObjectId"
    }),
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
    releaseDate: z.string({
      required_error: "Release date is required",
      invalid_type_error: "Release date must be text and not empty"
    })    
  })).optional(),
}).strict("Additional fields are not allowed");

export const createManySeriesSchema = z.object({
  series: z.array(seriesSchema,{
    required_error: "Series list is required",  
    invalid_type_error: "Series list must be an array"
  }).min(1, "At least one series must be provided")
});

export const updateSeriesSchema = z.object({
  series: seriesSchema.partial(),
});

export type Series = z.infer<typeof seriesSchema>;
export type CreateManySeriesPayload = z.infer<typeof createManySeriesSchema>;
export type UpdateSeriesPayload = z.infer<typeof updateSeriesSchema>;






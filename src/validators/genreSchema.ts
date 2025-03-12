import { z } from 'zod';

// Schema para cada item do gênero
export const genreCreateSchema = z.object({
  name: z.string({
    required_error: "Name is required",
    invalid_type_error: "Name must be text"
  }).min(2, "Name must have at least 2 characters"),
  
  id: z.number({
    required_error: "ID is required",
    invalid_type_error: "ID must be a number"}),

  poster: z.string({
    invalid_type_error: "Poster URL must be text"
  }).optional()
}).strict("Additional fields are not allowed");

// Schema para o payload completo
export const createManyGenreSchema = z.object({
  genres: z.array(genreCreateSchema, {
    required_error: "Genre list is required",
    invalid_type_error: "Genre list must be an array"
  }).min(1, "At least one genre must be provided")
});

// Tipos inferidos dos schemas
export type GenreCreatePayload = z.infer<typeof genreCreateSchema>;

export type CreateManyGenrePayload = z.infer<typeof createManyGenreSchema>;

export const genreUpdateSchema = genreCreateSchema.partial();

export type GenreUpdatePayload = z.infer<typeof genreUpdateSchema>;

export const genreByNameSchema = z.object({
  name: z.string({
    required_error: "Name is required",
    invalid_type_error: "Name must be text"
  }).min(2, "Name must have at least 2 characters")
});

export type GenreByNamePayload = z.infer<typeof genreByNameSchema>;

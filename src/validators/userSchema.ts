import { z } from "zod";
import { objectIdSchema } from "./common";

const UserPreferencesSchema = z.object({
  favoriteActors: z.array(objectIdSchema),
  favoriteGenres: z.array(objectIdSchema),
  contentMaturity: z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17', 'All']).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string(),
});

const UserStatsSchema = z.object({
  seriesCompleted: z.number(),
  lastActive: z.date(),
  joinDate: z.date(),
  favoriteStreamingType: objectIdSchema,
  episodesWatched: z.number(),
  moviesWatched: z.number(),
  totalWatchTimeInMinutes: z.number(),
});

export const UserCreateSchema = z.object({
  username: z.string(),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().refine((password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  }, { message: 'Password has to be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character' }),
  active: z.boolean().default(true),
  profilePicture: z.string().url().optional(),
  preferences: UserPreferencesSchema.optional(),
  stats: UserStatsSchema.optional(),
  role: z.enum(['user', 'admin', 'moderator']).optional().default('user'),
});

export type UserCreateSchemaType = z.infer<typeof UserCreateSchema>;

export const UserUpdateSchema = UserCreateSchema.partial();

export type UserUpdateSchemaType = z.infer<typeof UserUpdateSchema>;

export const UserLoginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export type UserLoginSchemaType = z.infer<typeof UserLoginSchema>;


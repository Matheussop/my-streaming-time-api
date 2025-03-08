import { z } from 'zod';
import { Types } from 'mongoose';

/**
 * Schema to validate if a value is a valid Mongoose ObjectId
 * Accepts both string and ObjectId directly
 */
export const objectIdSchema = z.union([
  z.string().refine(
    (val) => {
      try {
        return Types.ObjectId.isValid(val);
      } catch (error) {
        return false;
      }
    },
    {
      message: 'Invalid ID: must be a valid ObjectId'
    }
  ),
  z.instanceof(Types.ObjectId, {
    message: 'Invalid ID: must be a valid ObjectId'
  })
], { errorMap: () => ({ message: "Invalid ID: must be a valid ObjectId" }) });

export type ObjectIdSchemaType = z.infer<typeof objectIdSchema>;
/**
 * Converts the value to ObjectId, regardless of whether it is a string or already an ObjectId
 */
export const toObjectId = (value: string | Types.ObjectId): Types.ObjectId => {
  if (value instanceof Types.ObjectId) {
    return value;
  }
  return new Types.ObjectId(value);
};

/**
 * Schema to validate pagination
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

export type PaginationSchemaType = z.infer<typeof paginationSchema>;

/**
 * Schema to validate dates in ISO format
 */
export const dateSchema = z.string({
  required_error: "Release date is required",
}).regex(
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/,
  { message: 'Date must be in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS.MSSZ)' }
); 
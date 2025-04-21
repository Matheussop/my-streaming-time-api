import { randomBytes } from 'crypto';
import { Types } from 'mongoose';
/**
 * Generates a valid MongoDB ObjectId.
 * @returns {string} A valid MongoDB ObjectId.
 */
export const generateValidObjectId = (): string | Types.ObjectId => {
  const hexString = randomBytes(12).toString('hex');
  return hexString;
};

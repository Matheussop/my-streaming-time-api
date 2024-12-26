import { randomBytes } from 'crypto';

/**
 * Generates a valid MongoDB ObjectId.
 * @returns {string} A valid MongoDB ObjectId.
 */
export const generateValidObjectId = (): string => {
  const hexString = randomBytes(12).toString('hex');
  return hexString;
};

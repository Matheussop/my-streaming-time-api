import { Types } from 'mongoose';
import { objectIdSchema, paginationSchema, dateSchema, toObjectId } from '../common';


describe('objectIdSchema', () => {
  it('should validate a valid ObjectId string', () => {
    const validId = '507f1f77bcf86cd799439011';
    const result = objectIdSchema.safeParse(validId);
    expect(result.success).toBe(true);
  });

  it('should validate a mongoose ObjectId instance', () => {
    const objectId = new Types.ObjectId();
    const result = objectIdSchema.safeParse(objectId);
    expect(result.success).toBe(true);
  });

  it('should reject an invalid ObjectId string', () => {
    const invalidId = 'invalid-id';
    const result = objectIdSchema.safeParse(invalidId);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid ID: must be a valid ObjectId');
    }
  });

  it('should reject a number', () => {
    const result = objectIdSchema.safeParse(123);
    expect(result.success).toBe(false);
  });
});

describe('toObjectId', () => {
  it('should convert a string to ObjectId', () => {
    const idString = '507f1f77bcf86cd799439011';
    const result = toObjectId(idString);
    expect(result).toBeInstanceOf(Types.ObjectId);
    expect(result.toString()).toBe(idString);
  });

  it('should return the same ObjectId if already an ObjectId', () => {
    const objectId = new Types.ObjectId();
    const result = toObjectId(objectId);
    expect(result).toBe(objectId);
  });
});

describe('paginationSchema', () => {
  it('should use default values when none provided', () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ page: 1, limit: 10 });
    }
  });

  it('should correctly parse string values to numbers', () => {
    const result = paginationSchema.safeParse({ page: '2', limit: '20' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ page: 2, limit: 20 });
    }
  });

  it('should reject negative page values', () => {
    const result = paginationSchema.safeParse({ page: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject page zero', () => {
    const result = paginationSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject limit values greater than 100', () => {
    const result = paginationSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it('should accept valid pagination values', () => {
    const result = paginationSchema.safeParse({ page: 5, limit: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ page: 5, limit: 50 });
    }
  });
});

describe('dateSchema', () => {
  it('should validate a date in YYYY-MM-DD format', () => {
    const result = dateSchema.safeParse('2023-01-01');
    expect(result.success).toBe(true);
  });

  it('should validate a date in full ISO format', () => {
    const result = dateSchema.safeParse('2023-01-01T12:30:45.123Z');
    expect(result.success).toBe(true);
  });

  it('should validate a date in ISO format without milliseconds', () => {
    const result = dateSchema.safeParse('2023-01-01T12:30:45Z');
    expect(result.success).toBe(true);
  });

  it('should validate a date in ISO format without Z', () => {
    const result = dateSchema.safeParse('2023-01-01T12:30:45');
    expect(result.success).toBe(true);
  });

  it('should reject an empty string', () => {
    const result = dateSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('should reject an invalid date format', () => {
    const result = dateSchema.safeParse('01/01/2023');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Date must be in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS.MSSZ)');
    }
  });

  it('should reject an malformed ISO date', () => {
    const invalidDate = 'invalid-iso-date';
    const result = dateSchema.safeParse(invalidDate);
    expect(result.success).toBe(false);
  });
});

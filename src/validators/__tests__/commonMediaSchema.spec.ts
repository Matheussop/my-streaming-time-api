import { Types } from 'mongoose';
import { 
  commonMediaCreateSchema,
  commonMediaUpdateSchema,
  commonMediaByTitleParamSchema,
  commonMediaByGenreParamSchema,
  commonMediaUpdateFromTMDBSchema
} from '../commonMediaSchema';

describe('commonMediaCreateSchema', () => {
  it('should validate a complete valid media object with number genre array', () => {
    const validMedia = {
      title: 'Test Movie',
      releaseDate: '2023-01-01',
      plot: 'A test movie plot',
      cast: ['Actor 1', 'Actor 2'],
      rating: 8.5,
      genre: [1, 2, 3],
      status: 'Watching',
      tmdbId: 12345,
      poster: 'http://example.com/poster.jpg',
      url: 'http://example.com/movie',
      videoUrl: 'http://example.com/video.mp4'
    };
    
    const result = commonMediaCreateSchema.safeParse(validMedia);
    expect(result.success).toBe(true);
  });

  it('should validate a complete valid media object with object genre array', () => {
    const objectId = new Types.ObjectId();
    const validMedia = {
      title: 'Test Movie',
      releaseDate: '2023-01-01',
      plot: 'A test movie plot',
      cast: ['Actor 1', 'Actor 2'],
      rating: 8.5,
      genre: [
        { _id: objectId, id: 1, name: 'Action' },
        { _id: objectId.toString(), id: 2, name: 'Drama' }
      ],
      status: 'Watching',
      tmdbId: 12345,
      poster: 'http://example.com/poster.jpg',
      url: 'http://example.com/movie',
      videoUrl: 'http://example.com/video.mp4'
    };
    
    const result = commonMediaCreateSchema.safeParse(validMedia);
    expect(result.success).toBe(true);
  });

  it('should validate a media object with only required fields', () => {
    const validMedia = {
      title: 'Test Movie',
      releaseDate: '2023-01-01',
      genre: [1]
    };
    
    const result = commonMediaCreateSchema.safeParse(validMedia);
    expect(result.success).toBe(true);
  });

  it('should reject when title is missing', () => {
    const invalidMedia = {
      releaseDate: '2023-01-01',
      genre: [1]
    };
    
    const result = commonMediaCreateSchema.safeParse(invalidMedia);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Title is required');
    }
  });

  it('should reject when title is too short', () => {
    const invalidMedia = {
      title: 'A',
      releaseDate: '2023-01-01',
      genre: [1]
    };
    
    const result = commonMediaCreateSchema.safeParse(invalidMedia);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Title must have at least 2 characters');
    }
  });

  it('should reject when releaseDate is missing', () => {
    const invalidMedia = {
      title: 'Test Movie',
      genre: [1]
    };
    
    const result = commonMediaCreateSchema.safeParse(invalidMedia);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Release date is required');
    }
  });

  it('should reject when releaseDate has invalid format', () => {
    const invalidMedia = {
      title: 'Test Movie',
      releaseDate: '01/01/2023',
      genre: [1]
    };
    
    const result = commonMediaCreateSchema.safeParse(invalidMedia);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Date must be in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS.MSSZ)');
    }
  });

  it('should reject when genre is missing', () => {
    const invalidMedia = {
      title: 'Test Movie',
      releaseDate: '2023-01-01'
    };
    
    const result = commonMediaCreateSchema.safeParse(invalidMedia);
    expect(result.success).toBe(false);
  });

  it('should reject when genre is an empty array', () => {
    const invalidMedia = {
      title: 'Test Movie',
      releaseDate: '2023-01-01',
      genre: []
    };
    
    const result = commonMediaCreateSchema.safeParse(invalidMedia);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('At least one genre must be provided');
    }
  });

  it('should reject when genre has invalid structure', () => {
    const invalidMedia = {
      title: 'Test Movie',
      releaseDate: '2023-01-01',
      genre: ['Action'] // Strings instead of numbers or objects
    };
    
    const result = commonMediaCreateSchema.safeParse(invalidMedia);
    expect(result.success).toBe(false);
  });

  it('should reject negative rating', () => {
    const invalidMedia = {
      title: 'Test Movie',
      releaseDate: '2023-01-01',
      genre: [1],
      rating: -1
    };
    
    const result = commonMediaCreateSchema.safeParse(invalidMedia);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Rating must be equal or greater than 0');
    }
  });

  it('should reject invalid videoUrl', () => {
    const invalidMedia = {
      title: 'Test Movie',
      releaseDate: '2023-01-01',
      genre: [1],
      videoUrl: 'not-a-url'
    };
    
    const result = commonMediaCreateSchema.safeParse(invalidMedia);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Video URL must be a valid URL');
    }
  });
});

describe('commonMediaUpdateSchema', () => {
  it('should validate a complete update object', () => {
    const validUpdate = {
      title: 'Updated Movie',
      releaseDate: '2023-02-02',
      plot: 'Updated plot',
      genre: [1, 2, 3]
    };
    
    const result = commonMediaUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate an empty update object', () => {
    const validUpdate = {};
    
    const result = commonMediaUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate partial updates with one field', () => {
    const validUpdate = {
      title: 'Updated Movie'
    };
    
    const result = commonMediaUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should still validate field constraints', () => {
    const invalidUpdate = {
      title: 'A', // Too short
    };
    
    const result = commonMediaUpdateSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Title must have at least 2 characters');
    }
  });
});

describe('commonMediaByTitleParamSchema', () => {
  it('should validate valid title search params with defaults', () => {
    const validParams = {
      title: 'Test Movie'
    };
    
    const result = commonMediaByTitleParamSchema.safeParse(validParams);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        title: 'Test Movie',
        page: 1,
        limit: 10
      });
    }
  });

  it('should validate valid title search params with pagination', () => {
    const validParams = {
      title: 'Test Movie',
      page: 2,
      limit: 20
    };
    
    const result = commonMediaByTitleParamSchema.safeParse(validParams);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validParams);
    }
  });

  it('should reject when title is missing', () => {
    const invalidParams = {
      page: 1,
      limit: 10
    };
    
    const result = commonMediaByTitleParamSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Title is required');
    }
  });

  it('should reject when title is too short', () => {
    const invalidParams = {
      title: 'A'
    };
    
    const result = commonMediaByTitleParamSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Title must have at least 2 characters');
    }
  });
});

describe('commonMediaByGenreParamSchema', () => {
  it('should validate valid genre search params', () => {
    const validParams = {
      genre: 'Action'
    };
    
    const result = commonMediaByGenreParamSchema.safeParse(validParams);
    expect(result.success).toBe(true);
  });

  it('should reject when genre is missing', () => {
    const invalidParams = {};
    
    const result = commonMediaByGenreParamSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Genre is required');
    }
  });

  it('should reject when genre is too short', () => {
    const invalidParams = {
      genre: 'A'
    };
    
    const result = commonMediaByGenreParamSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Genre must have at least 2 characters');
    }
  });
});

describe('commonMediaUpdateFromTMDBSchema', () => {
  it('should validate valid TMDB update params with ObjectId as string', () => {
    const validId = '507f1f77bcf86cd799439011';
    const validParams = {
      id: validId,
      tmdbId: 12345
    };
    
    const result = commonMediaUpdateFromTMDBSchema.safeParse(validParams);
    expect(result.success).toBe(true);
  });

  it('should validate valid TMDB update params with ObjectId instance', () => {
    const objectId = new Types.ObjectId();
    const validParams = {
      id: objectId,
      tmdbId: 12345
    };
    
    const result = commonMediaUpdateFromTMDBSchema.safeParse(validParams);
    expect(result.success).toBe(true);
  });

  it('should reject when id is missing', () => {
    const invalidParams = {
      tmdbId: 12345
    };
    
    const result = commonMediaUpdateFromTMDBSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject when id is invalid', () => {
    const invalidParams = {
      id: 'invalid-id',
      tmdbId: 12345
    };
    
    const result = commonMediaUpdateFromTMDBSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid ID: must be a valid ObjectId');
    }
  });

  it('should reject when tmdbId is missing', () => {
    const validId = '507f1f77bcf86cd799439011';
    const invalidParams = {
      id: validId
    };
    
    const result = commonMediaUpdateFromTMDBSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject when tmdbId is not a number', () => {
    const validId = '507f1f77bcf86cd799439011';
    const invalidParams = {
      id: validId,
      tmdbId: 'invalid'
    };
    
    const result = commonMediaUpdateFromTMDBSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('TMDB ID must be a number');
    }
  });
}); 
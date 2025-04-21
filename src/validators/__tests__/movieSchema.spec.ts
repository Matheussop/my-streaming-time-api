import { Types } from 'mongoose';
import { 
  movieCreateSchema,
  movieUpdateSchema,
  movieByTitleParamSchema,
  movieByGenreParamSchema,
  movieUpdateFromTMDBSchema
} from '../movieSchema';

describe('movieCreateSchema', () => {
  it('should validate a complete valid movie object with number genre array', () => {
    const validMovie = {
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
      durationTime: 120,
      videoUrl: 'http://example.com/video.mp4'
    };
    
    const result = movieCreateSchema.safeParse(validMovie);
    expect(result.success).toBe(true);
  });

  it('should validate a complete valid movie object with object genre array', () => {
    const objectId = new Types.ObjectId();
    const validMovie = {
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
      durationTime: 120,
      videoUrl: 'http://example.com/video.mp4'
    };
    
    const result = movieCreateSchema.safeParse(validMovie);
    expect(result.success).toBe(true);
  });

  it('should validate a movie object with only required fields', () => {
    const validMovie = {
      title: 'Test Movie',
      releaseDate: '2023-01-01',
      genre: [1]
    };
    
    const result = movieCreateSchema.safeParse(validMovie);
    expect(result.success).toBe(true);
  });

  it('should reject when title is missing', () => {
    const invalidMovie = {
      releaseDate: '2023-01-01',
      genre: [1]
    };
    
    const result = movieCreateSchema.safeParse(invalidMovie);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Title is required');
    }
  });

  it('should reject when title is too short', () => {
    const invalidMovie = {
      title: 'A',
      releaseDate: '2023-01-01',
      genre: [1]
    };
    
    const result = movieCreateSchema.safeParse(invalidMovie);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Title must have at least 2 characters');
    }
  });

  it('should reject when releaseDate is missing', () => {
    const invalidMovie = {
      title: 'Test Movie',
      genre: [1]
    };
    
    const result = movieCreateSchema.safeParse(invalidMovie);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Release date is required');
    }
  });

  it('should reject when genre is missing', () => {
    const invalidMovie = {
      title: 'Test Movie',
      releaseDate: '2023-01-01'
    };
    
    const result = movieCreateSchema.safeParse(invalidMovie);
    expect(result.success).toBe(false);
  });

  it('should reject when genre is an empty array', () => {
    const invalidMovie = {
      title: 'Test Movie',
      releaseDate: '2023-01-01',
      genre: []
    };
    
    const result = movieCreateSchema.safeParse(invalidMovie);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('At least one genre must be provided');
    }
  });

  it('should reject when durationTime is less than 1', () => {
    const invalidMovie = {
      title: 'Test Movie',
      releaseDate: '2023-01-01',
      genre: [1],
      durationTime: 0
    };
    
    const result = movieCreateSchema.safeParse(invalidMovie);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Duration must be equal or greater than 1');
    }
  });

  it('should reject invalid videoUrl', () => {
    const invalidMovie = {
      title: 'Test Movie',
      releaseDate: '2023-01-01',
      genre: [1],
      videoUrl: 'not-a-url'
    };
    
    const result = movieCreateSchema.safeParse(invalidMovie);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Video URL must be a valid URL');
    }
  });
});

describe('movieUpdateSchema', () => {
  it('should validate a complete update object', () => {
    const validUpdate = {
      title: 'Updated Movie',
      releaseDate: '2023-02-02',
      plot: 'Updated plot',
      genre: [1, 2, 3],
      durationTime: 150
    };
    
    const result = movieUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate an empty update object', () => {
    const validUpdate = {};
    
    const result = movieUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate partial updates with one field', () => {
    const validUpdate = {
      title: 'Updated Movie'
    };
    
    const result = movieUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should still validate field constraints', () => {
    const invalidUpdate = {
      title: 'A', // Too short
    };
    
    const result = movieUpdateSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Title must have at least 2 characters');
    }
  });
});

describe('movieByTitleParamSchema', () => {
  it('should validate valid title search params with defaults', () => {
    const validParams = {
      title: 'Test Movie'
    };
    
    const result = movieByTitleParamSchema.safeParse(validParams);
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
    
    const result = movieByTitleParamSchema.safeParse(validParams);
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
    
    const result = movieByTitleParamSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Title is required');
    }
  });

  it('should reject when title is too short', () => {
    const invalidParams = {
      title: 'A'
    };
    
    const result = movieByTitleParamSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Title must have at least 2 characters');
    }
  });
});

describe('movieByGenreParamSchema', () => {
  it('should validate valid genre search params', () => {
    const validParams = {
      genre: 'Action'
    };
    
    const result = movieByGenreParamSchema.safeParse(validParams);
    expect(result.success).toBe(true);
  });

  it('should reject when genre is missing', () => {
    const invalidParams = {};
    
    const result = movieByGenreParamSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Genre is required');
    }
  });

  it('should reject when genre is too short', () => {
    const invalidParams = {
      genre: 'A'
    };
    
    const result = movieByGenreParamSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Genre must have at least 2 characters');
    }
  });
});

describe('movieUpdateFromTMDBSchema', () => {
  it('should validate valid TMDB update params with ObjectId as string', () => {
    const validId = '507f1f77bcf86cd799439011';
    const validParams = {
      id: validId,
      tmdbId: 12345
    };
    
    const result = movieUpdateFromTMDBSchema.safeParse(validParams);
    expect(result.success).toBe(true);
  });

  it('should validate valid TMDB update params with ObjectId instance', () => {
    const objectId = new Types.ObjectId();
    const validParams = {
      id: objectId,
      tmdbId: 12345
    };
    
    const result = movieUpdateFromTMDBSchema.safeParse(validParams);
    expect(result.success).toBe(true);
  });

  it('should reject when id is missing', () => {
    const invalidParams = {
      tmdbId: 12345
    };
    
    const result = movieUpdateFromTMDBSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject when id is invalid', () => {
    const invalidParams = {
      id: 'invalid-id',
      tmdbId: 12345
    };
    
    const result = movieUpdateFromTMDBSchema.safeParse(invalidParams);
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
    
    const result = movieUpdateFromTMDBSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject when tmdbId is not a number', () => {
    const validId = '507f1f77bcf86cd799439011';
    const invalidParams = {
      id: validId,
      tmdbId: 'invalid'
    };
    
    const result = movieUpdateFromTMDBSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('TMDB ID must be a number');
    }
  });
}); 
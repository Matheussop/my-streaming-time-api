import { Types } from 'mongoose';
import {
  seriesCreateSchema,
  createManySeriesSchema,
  updateSeriesSchema,
  seriesByTitleParamSchema,
  seriesByGenreParamSchema
} from '../seriesSchema';
import { paginationSchema } from '../common';

describe('seriesCreateSchema', () => {  
  jest.mock('../common', () => ({
    paginationSchema: {
      ...paginationSchema,
      safeParse: jest.fn().mockImplementation((val: any) => ({ success: true, data: { 
        page: val.page || 1,
        limit: val.limit || 10
      } }))
    }
  }));

  it('should validate a complete valid series object with number genre array', () => {
    const objectId = new Types.ObjectId();
    const validSeries = {
      title: 'Test Series',
      releaseDate: '2023-01-01',
      plot: 'A test series plot',
      cast: ['Actor 1', 'Actor 2'],
      rating: 8.5,
      genre: [1, 2, 3],
      status: 'Ongoing',
      tmdbId: 12345,
      poster: 'http://example.com/poster.jpg',
      url: 'http://example.com/series',
      totalEpisodes: 24,
      totalSeasons: 3,
      seasonsSummary: [
        {
          seasonId: objectId,
          seasonNumber: 1,
          title: 'Season 1',
          episodeCount: 8,
          releaseDate: '2023-01-01'
        },
        {
          seasonId: objectId,
          seasonNumber: 2,
          title: 'Season 2',
          episodeCount: 8,
          releaseDate: '2023-06-01'
        },
        {
          seasonId: objectId,
          seasonNumber: 3,
          title: 'Season 3',
          episodeCount: 8,
          releaseDate: '2024-01-01'
        }
      ]
    };
    
    const result = seriesCreateSchema.safeParse(validSeries);
    expect(result.success).toBe(true);
  });

  it('should validate a complete valid series object with object genre array', () => {
    const objectId = new Types.ObjectId();
    const validSeries = {
      title: 'Test Series',
      releaseDate: '2023-01-01',
      plot: 'A test series plot',
      cast: ['Actor 1', 'Actor 2'],
      rating: 8.5,
      genre: [
        { _id: objectId, id: 1, name: 'Action' },
        { _id: objectId.toString(), id: 2, name: 'Drama' }
      ],
      status: 'Ongoing',
      tmdbId: 12345,
      poster: 'http://example.com/poster.jpg',
      url: 'http://example.com/series',
      totalEpisodes: 24,
      totalSeasons: 3
    };
    
    const result = seriesCreateSchema.safeParse(validSeries);
    expect(result.success).toBe(true);
  });

  it('should validate a series with only required fields', () => {
    const validSeries = {
      title: 'Test Series',
      releaseDate: '2023-01-01',
      genre: [1],
      totalEpisodes: 10,
      totalSeasons: 1
    };
    
    const result = seriesCreateSchema.safeParse(validSeries);
    expect(result.success).toBe(true);
  });

  it('should reject when title is missing', () => {
    const invalidSeries = {
      releaseDate: '2023-01-01',
      genre: [1],
      totalEpisodes: 10,
      totalSeasons: 1
    };
    
    const result = seriesCreateSchema.safeParse(invalidSeries);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Title is required');
    }
  });

  it('should reject when title is too short', () => {
    const invalidSeries = {
      title: 'A',
      releaseDate: '2023-01-01',
      genre: [1],
      totalEpisodes: 10,
      totalSeasons: 1
    };
    
    const result = seriesCreateSchema.safeParse(invalidSeries);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Title must have at least 2 characters');
    }
  });

  it('should reject when releaseDate is missing', () => {
    const invalidSeries = {
      title: 'Test Series',
      genre: [1],
      totalEpisodes: 10,
      totalSeasons: 1
    };
    
    const result = seriesCreateSchema.safeParse(invalidSeries);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Release date is required');
    }
  });

  it('should reject when genre is missing', () => {
    const invalidSeries = {
      title: 'Test Series',
      releaseDate: '2023-01-01',
      totalEpisodes: 10,
      totalSeasons: 1
    };
    
    const result = seriesCreateSchema.safeParse(invalidSeries);
    expect(result.success).toBe(false);
  });

  it('should reject when genre is an empty array', () => {
    const invalidSeries = {
      title: 'Test Series',
      releaseDate: '2023-01-01',
      genre: [],
      totalEpisodes: 10,
      totalSeasons: 1
    };
    
    const result = seriesCreateSchema.safeParse(invalidSeries);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('At least one genre must be provided');
    }
  });

  it('should reject when totalEpisodes is missing', () => {
    const invalidSeries = {
      title: 'Test Series',
      releaseDate: '2023-01-01',
      genre: [1],
      totalSeasons: 1
    };
    
    const result = seriesCreateSchema.safeParse(invalidSeries);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Total episodes is required');
    }
  });

  it('should reject when totalEpisodes is less than 1', () => {
    const invalidSeries = {
      title: 'Test Series',
      releaseDate: '2023-01-01',
      genre: [1],
      totalEpisodes: 0,
      totalSeasons: 1
    };
    
    const result = seriesCreateSchema.safeParse(invalidSeries);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Total episodes must be equal or greater than 1');
    }
  });

  it('should reject when totalSeasons is missing', () => {
    const invalidSeries = {
      title: 'Test Series',
      releaseDate: '2023-01-01',
      genre: [1],
      totalEpisodes: 10
    };
    
    const result = seriesCreateSchema.safeParse(invalidSeries);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Total seasons is required');
    }
  });

  it('should reject when totalSeasons is less than 1', () => {
    const invalidSeries = {
      title: 'Test Series',
      releaseDate: '2023-01-01',
      genre: [1],
      totalEpisodes: 10,
      totalSeasons: 0
    };
    
    const result = seriesCreateSchema.safeParse(invalidSeries);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Total seasons must be equal or greater than 1');
    }
  });

  it('should reject when seasonsSummary has invalid seasonId', () => {
    const invalidSeries = {
      title: 'Test Series',
      releaseDate: '2023-01-01',
      genre: [1],
      totalEpisodes: 10,
      totalSeasons: 1,
      seasonsSummary: [
        {
          seasonId: 'invalid-id',
          seasonNumber: 1,
          title: 'Season 1',
          episodeCount: 10,
          releaseDate: '2023-01-01'
        }
      ]
    };
    
    const result = seriesCreateSchema.safeParse(invalidSeries);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid ID: must be a valid ObjectId');
    }
  });

  it('should reject additional fields', () => {
    const invalidSeries = {
      title: 'Test Series',
      releaseDate: '2023-01-01',
      genre: [1],
      totalEpisodes: 10,
      totalSeasons: 1,
      extraField: 'This should not be allowed'
    };
    
    const result = seriesCreateSchema.safeParse(invalidSeries);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Additional fields are not allowed');
    }
  });
});

describe('createManySeriesSchema', () => {
  it('should validate an array of valid series', () => {
    const validSeriesList = {
      series: [
        {
          title: 'Series 1',
          releaseDate: '2023-01-01',
          genre: [1],
          totalEpisodes: 10,
          totalSeasons: 1
        },
        {
          title: 'Series 2',
          releaseDate: '2023-02-01',
          genre: [2, 3],
          totalEpisodes: 8,
          totalSeasons: 1
        }
      ]
    };
    
    const result = createManySeriesSchema.safeParse(validSeriesList);
    expect(result.success).toBe(true);
  });

  it('should reject an empty series array', () => {
    const invalidSeriesList = {
      series: []
    };
    
    const result = createManySeriesSchema.safeParse(invalidSeriesList);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('At least one series must be provided');
    }
  });

  it('should reject when series is not an array', () => {
    const invalidSeriesList = {
      series: 'not-an-array'
    };
    
    const result = createManySeriesSchema.safeParse(invalidSeriesList);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Series list must be an array');
    }
  });

  it('should reject when series is missing', () => {
    const invalidSeriesList = {};
    
    const result = createManySeriesSchema.safeParse(invalidSeriesList);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Series list is required');
    }
  });

  it('should reject when any series in the array is invalid', () => {
    const invalidSeriesList = {
      series: [
        {
          title: 'Series 1',
          releaseDate: '2023-01-01',
          genre: [1],
          totalEpisodes: 10,
          totalSeasons: 1
        },
        {
          title: 'A', // Too short
          releaseDate: '2023-02-01',
          genre: [2, 3],
          totalEpisodes: 8,
          totalSeasons: 1
        }
      ]
    };
    
    const result = createManySeriesSchema.safeParse(invalidSeriesList);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Title must have at least 2 characters');
    }
  });
});

describe('updateSeriesSchema', () => {
  it('should validate a complete update object', () => {
    const objectId = new Types.ObjectId();
    const validUpdate = {
      seasonId: objectId,
      title: 'Updated Series',
      totalEpisodes: 12,
      totalSeasons: 2
    };
    
    const result = updateSeriesSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate an empty update object', () => {
    const validUpdate = {};
    
    const result = updateSeriesSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate partial updates with one field', () => {
    const validUpdate = {
      title: 'Updated Series'
    };
    
    const result = updateSeriesSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate the seasonId field', () => {
    const objectId = new Types.ObjectId();
    const validUpdate = {
      seasonId: objectId
    };
    
    const result = updateSeriesSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should reject when seasonId is invalid', () => {
    const invalidUpdate = {
      seasonId: 'invalid-id'
    };
    
    const result = updateSeriesSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid ID: must be a valid ObjectId');
    }
  });

  it('should still validate field constraints', () => {
    const invalidUpdate = {
      title: 'A' // Too short
    };
    
    const result = updateSeriesSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Title must have at least 2 characters');
    }
  });
});

describe('seriesByTitleParamSchema', () => {
  it('should validate valid title search params with defaults', () => {
    const validParams = {
      title: 'Test Series'
    };
    
    const result = seriesByTitleParamSchema.safeParse(validParams);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        title: 'Test Series',
        page: 1,
        limit: 10
      });
    }
  });

  it('should validate valid title search params with pagination', () => {
    const validParams = {
      title: 'Test Series',
      page: 2,
      limit: 20
    };
    
    const result = seriesByTitleParamSchema.safeParse(validParams);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validParams);
    }
  });

  it('should reject when title is too short', () => {
    const invalidParams = {
      title: 'A'
    };
    
    const result = seriesByTitleParamSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Title must have at least 2 characters');
    }
  });
});

describe('seriesByGenreParamSchema', () => {
  it('should validate valid genre search params with defaults', () => {
    const validParams = {
      genre: 'Action'
    };
    
    const result = seriesByGenreParamSchema.safeParse(validParams);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        genre: 'Action',
      });
    }
  });

  it('should validate valid genre search params with pagination', () => {
    const validParams = {
      genre: 'Action',
      page: 2,
      limit: 20
    };
    
    const result = seriesByGenreParamSchema.safeParse(validParams);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validParams);
    }
  });

  it('should reject when genre is too short', () => {
    const invalidParams = {
      genre: 'A'
    };
    
    const result = seriesByGenreParamSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Genre must have at least 2 characters');
    }
  });
}); 
import { Types } from 'mongoose';
import {
  episodeSchema,
  seasonCreateSchema,
  seasonUpdateSchema,
  seasonsBySeriesParamSchema,
  episodesBySeasonNumberParamSchema
} from '../seasonSchema';

describe('episodeSchema', () => {
  it('should validate a valid episode', () => {
    const validEpisode = {
      episodeNumber: 1,
      title: 'Pilot',
      plot: 'The first episode of the series',
      durationInMinutes: 45,
      releaseDate: '2023-01-01',
      poster: 'http://example.com/poster.jpg'
    };
    
    const result = episodeSchema.safeParse(validEpisode);
    expect(result.success).toBe(true);
  });

  it('should reject when episodeNumber is missing', () => {
    const invalidEpisode = {
      title: 'Pilot',
      plot: 'The first episode of the series',
      durationInMinutes: 45,
      releaseDate: '2023-01-01',
      poster: 'http://example.com/poster.jpg'
    };
    
    const result = episodeSchema.safeParse(invalidEpisode);
    expect(result.success).toBe(false);
  });

  it('should reject when episodeNumber is zero or negative', () => {
    const invalidEpisode = {
      episodeNumber: 0,
      title: 'Pilot',
      plot: 'The first episode of the series',
      durationInMinutes: 45,
      releaseDate: '2023-01-01',
      poster: 'http://example.com/poster.jpg'
    };
    
    const result = episodeSchema.safeParse(invalidEpisode);
    expect(result.success).toBe(false);
  });

  it('should reject when title is empty', () => {
    const invalidEpisode = {
      episodeNumber: 1,
      title: '',
      plot: 'The first episode of the series',
      durationInMinutes: 45,
      releaseDate: '2023-01-01',
      poster: 'http://example.com/poster.jpg'
    };
    
    const result = episodeSchema.safeParse(invalidEpisode);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Título é obrigatório');
    }
  });

  it('should reject when durationInMinutes is not positive', () => {
    const invalidEpisode = {
      episodeNumber: 1,
      title: 'Pilot',
      plot: 'The first episode of the series',
      durationInMinutes: 0,
      releaseDate: '2023-01-01',
      poster: 'http://example.com/poster.jpg'
    };
    
    const result = episodeSchema.safeParse(invalidEpisode);
    expect(result.success).toBe(false);
  });

  it('should reject when poster is not a valid URL', () => {
    const invalidEpisode = {
      episodeNumber: 1,
      title: 'Pilot',
      plot: 'The first episode of the series',
      durationInMinutes: 45,
      releaseDate: '2023-01-01',
      poster: 'not-a-valid-url'
    };
    
    const result = episodeSchema.safeParse(invalidEpisode);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Poster deve ser uma URL válida');
    }
  });
});

describe('seasonCreateSchema', () => {
  it('should validate a complete valid season', () => {
    const objectId = new Types.ObjectId();
    const validSeason = {
      seriesId: objectId,
      seasonNumber: 1,
      title: 'Season 1',
      plot: 'The first season of the series',
      releaseDate: '2023-01-01',
      poster: 'http://example.com/poster.jpg',
      episodes: [
        {
          episodeNumber: 1,
          title: 'Pilot',
          plot: 'The first episode of the series',
          durationInMinutes: 45,
          releaseDate: '2023-01-01',
          poster: 'http://example.com/episode1.jpg'
        },
        {
          episodeNumber: 2,
          title: 'Episode 2',
          plot: 'The second episode of the series',
          durationInMinutes: 42,
          releaseDate: '2023-01-08',
          poster: 'http://example.com/episode2.jpg'
        }
      ]
    };
    
    const result = seasonCreateSchema.safeParse(validSeason);
    expect(result.success).toBe(true);
  });

  it('should validate a season without episodes', () => {
    const objectId = new Types.ObjectId();
    const validSeason = {
      seriesId: objectId,
      seasonNumber: 1,
      title: 'Season 1',
      plot: 'The first season of the series',
      releaseDate: '2023-01-01'
    };
    
    const result = seasonCreateSchema.safeParse(validSeason);
    expect(result.success).toBe(true);
  });

  it('should reject when seriesId is missing', () => {
    const invalidSeason = {
      seasonNumber: 1,
      title: 'Season 1',
      plot: 'The first season of the series',
      releaseDate: '2023-01-01'
    };
    
    const result = seasonCreateSchema.safeParse(invalidSeason);
    expect(result.success).toBe(false);
  });

  it('should reject when seriesId is invalid', () => {
    const invalidSeason = {
      seriesId: 'invalid-id',
      seasonNumber: 1,
      title: 'Season 1',
      plot: 'The first season of the series',
      releaseDate: '2023-01-01'
    };
    
    const result = seasonCreateSchema.safeParse(invalidSeason);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid ID: must be a valid ObjectId');
    }
  });

  it('should reject when seasonNumber is missing', () => {
    const objectId = new Types.ObjectId();
    const invalidSeason = {
      seriesId: objectId,
      title: 'Season 1',
      plot: 'The first season of the series',
      releaseDate: '2023-01-01'
    };
    
    const result = seasonCreateSchema.safeParse(invalidSeason);
    expect(result.success).toBe(false);
  });

  it('should reject when title is missing', () => {
    const objectId = new Types.ObjectId();
    const invalidSeason = {
      seriesId: objectId,
      seasonNumber: 1,
      plot: 'The first season of the series',
      releaseDate: '2023-01-01'
    };
    
    const result = seasonCreateSchema.safeParse(invalidSeason);
    expect(result.success).toBe(false);
  });

  it('should reject when title is empty', () => {
    const objectId = new Types.ObjectId();
    const invalidSeason = {
      seriesId: objectId,
      seasonNumber: 1,
      title: '',
      plot: 'The first season of the series',
      releaseDate: '2023-01-01'
    };
    
    const result = seasonCreateSchema.safeParse(invalidSeason);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Título é obrigatório');
    }
  });

  it('should reject when additional fields are provided', () => {
    const objectId = new Types.ObjectId();
    const invalidSeason = {
      seriesId: objectId,
      seasonNumber: 1,
      title: 'Season 1',
      plot: 'The first season of the series',
      releaseDate: '2023-01-01',
      extraField: 'This should not be allowed'
    };
    
    const result = seasonCreateSchema.safeParse(invalidSeason);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Additional fields are not allowed');
    }
  });
});

describe('seasonUpdateSchema', () => {
  it('should validate a complete update object', () => {
    const objectId = new Types.ObjectId();
    const episodeId = new Types.ObjectId();
    const validUpdate = {
      seriesId: objectId,
      seasonNumber: 2,
      title: 'Updated Season Title',
      plot: 'Updated season plot',
      releaseDate: '2023-02-01',
      poster: 'http://example.com/new-poster.jpg',
      episodes: [
        {
          _id: episodeId,
          episodeNumber: 1,
          title: 'Updated Episode',
          plot: 'Updated episode plot',
          durationInMinutes: 48,
          releaseDate: '2023-02-01',
          poster: 'http://example.com/updated-episode.jpg'
        }
      ]
    };
    
    const result = seasonUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate partial updates with only title', () => {
    const objectId = new Types.ObjectId();
    const validUpdate = {
      seriesId: objectId,
      title: 'New Season Title'
    };
    
    const result = seasonUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should reject when seriesId is missing', () => {
    const invalidUpdate = {
      title: 'Updated Season Title'
    };
    
    const result = seasonUpdateSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
  });

  it('should reject when seriesId is invalid', () => {
    const invalidUpdate = {
      seriesId: 'invalid-id',
      title: 'Updated Season Title'
    };
    
    const result = seasonUpdateSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid ID: must be a valid ObjectId');
    }
  });

  it('should reject when additional fields are provided', () => {
    const objectId = new Types.ObjectId();
    const invalidUpdate = {
      seriesId: objectId,
      title: 'Updated Season Title',
      extraField: 'This should not be allowed'
    };
    
    const result = seasonUpdateSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Additional fields are not allowed');
    }
  });
});

describe('seasonsBySeriesParamSchema', () => {
  it('should validate valid series params with defaults', () => {
    const objectId = new Types.ObjectId();
    const validParams = {
      seriesId: objectId
    };
    
    const result = seasonsBySeriesParamSchema.safeParse(validParams);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        seriesId: objectId,
        page: 1,
        limit: 10
      });
    }
  });

  it('should validate valid series params with pagination', () => {
    const objectId = new Types.ObjectId();
    const validParams = {
      seriesId: objectId,
      page: 2,
      limit: 20
    };
    
    const result = seasonsBySeriesParamSchema.safeParse(validParams);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        seriesId: objectId,
        page: 2,
        limit: 20
      });
    }
  });

  it('should reject when seriesId is missing', () => {
    const invalidParams = {
      page: 1,
      limit: 10
    };
    
    const result = seasonsBySeriesParamSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject when seriesId is invalid', () => {
    const invalidParams = {
      seriesId: 'invalid-id'
    };
    
    const result = seasonsBySeriesParamSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid ID: must be a valid ObjectId');
    }
  });
});

describe('episodesBySeasonNumberParamSchema', () => {
  it('should validate valid season number as string', () => {
    const validParams = {
      seasonNumber: '1'
    };
    
    const result = episodesBySeasonNumberParamSchema.safeParse(validParams);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.seasonNumber).toBe(1);
    }
  });

  it('should validate valid season number zero', () => {
    const validParams = {
      seasonNumber: '0'
    };
    
    const result = episodesBySeasonNumberParamSchema.safeParse(validParams);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.seasonNumber).toBe(0);
    }
  });

  it('should reject when seasonNumber is missing', () => {
    const invalidParams = {};
    
    const result = episodesBySeasonNumberParamSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject when seasonNumber is negative', () => {
    const invalidParams = {
      seasonNumber: '-1'
    };
    
    const result = episodesBySeasonNumberParamSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Number of season must be greater or equal to 0');
    }
  });

  it('should reject when seasonNumber is not a number string', () => {
    const invalidParams = {
      seasonNumber: 'abc'
    };
    
    const result = episodesBySeasonNumberParamSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });
}); 
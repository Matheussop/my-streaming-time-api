import { Types } from 'mongoose';
import {
  userStreamingHistoryCreateSchema,
  userStreamingHistoryUpdateSchema,
  userStreamingHistoryAddEntrySchema,
  userContentIdentifierSchema,
  userStreamingHistoryRemoveEpisodeSchema,
  userStreamingHistoryMarkSeasonSchema,
  userStreamingHistoryAddEpisodeSchema
} from '../userStreamingHistorySchema';

describe('userStreamingHistoryCreateSchema', () => {
  it('should validate a complete valid streaming history object', () => {
    const objectId = new Types.ObjectId();
    const validHistory = {
      userId: objectId,
      watchHistory: [
        {
          contentId: objectId,
          contentType: 'movie',
          title: 'Example Movie',
          watchedDurationInMinutes: 120,
          completionPercentage: 100,
          rating: 8.5
        },
        {
          contentId: objectId,
          contentType: 'series',
          title: 'Example Series',
          watchedDurationInMinutes: 240,
          seriesProgress: {
            totalEpisodes: 10,
            watchedEpisodes: 5,
            lastWatched: {
              episodeId: objectId,
              seasonNumber: 1,
              episodeNumber: 5,
              watchedDurationInMinutes: 45,
              completionPercentage: 100
            },
            episodesWatched: [
              {
                episodeId: objectId,
                seasonNumber: 1,
                episodeNumber: 1,
                watchedDurationInMinutes: 42,
                completionPercentage: 100
              },
              {
                episodeId: objectId,
                seasonNumber: 1,
                episodeNumber: 5,
                watchedDurationInMinutes: 45,
                completionPercentage: 100
              }
            ],
            nextToWatch: {
              seasonNumber: 1,
              episodeNumber: 6,
              episodeId: objectId
            },
            completed: false
          }
        }
      ],
      totalWatchTimeInMinutes: 360
    };
    
    const result = userStreamingHistoryCreateSchema.safeParse(validHistory);
    expect(result.success).toBe(true);
  });

  it('should validate a streaming history with only required fields', () => {
    const objectId = new Types.ObjectId();
    const validHistory = {
      userId: objectId,
      watchHistory: [
        {
          contentId: objectId,
          contentType: 'movie',
          title: 'Example Movie',
          watchedDurationInMinutes: 120
        }
      ]
    };
    
    const result = userStreamingHistoryCreateSchema.safeParse(validHistory);
    expect(result.success).toBe(true);
  });

  it('should reject when userId is missing', () => {
    const objectId = new Types.ObjectId();
    const invalidHistory = {
      watchHistory: [
        {
          contentId: objectId,
          contentType: 'movie',
          title: 'Example Movie',
          watchedDurationInMinutes: 120
        }
      ]
    };
    
    const result = userStreamingHistoryCreateSchema.safeParse(invalidHistory);
    expect(result.success).toBe(false);
  });

  it('should reject when userId is invalid', () => {
    const objectId = new Types.ObjectId();
    const invalidHistory = {
      userId: 'invalid-id',
      watchHistory: [
        {
          contentId: objectId,
          contentType: 'movie',
          title: 'Example Movie',
          watchedDurationInMinutes: 120
        }
      ]
    };
    
    const result = userStreamingHistoryCreateSchema.safeParse(invalidHistory);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid ID: must be a valid ObjectId');
    }
  });

  it('should reject when watchHistory is missing', () => {
    const objectId = new Types.ObjectId();
    const invalidHistory = {
      userId: objectId
    };
    
    const result = userStreamingHistoryCreateSchema.safeParse(invalidHistory);
    expect(result.success).toBe(false);
  });

  it('should reject when contentId is invalid', () => {
    const objectId = new Types.ObjectId();
    const invalidHistory = {
      userId: objectId,
      watchHistory: [
        {
          contentId: 'invalid-id',
          contentType: 'movie',
          title: 'Example Movie',
          watchedDurationInMinutes: 120
        }
      ]
    };
    
    const result = userStreamingHistoryCreateSchema.safeParse(invalidHistory);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Invalid ID: must be a valid ObjectId');
    }
  });

  it('should reject when contentType is invalid', () => {
    const objectId = new Types.ObjectId();
    const invalidHistory = {
      userId: objectId,
      watchHistory: [
        {
          contentId: objectId,
          contentType: 'invalid',
          title: 'Example Movie',
          watchedDurationInMinutes: 120
        }
      ]
    };
    
    const result = userStreamingHistoryCreateSchema.safeParse(invalidHistory);
    expect(result.success).toBe(false);
  });

  it('should reject when title is empty', () => {
    const objectId = new Types.ObjectId();
    const invalidHistory = {
      userId: objectId,
      watchHistory: [
        {
          contentId: objectId,
          contentType: 'movie',
          title: '',
          watchedDurationInMinutes: 120
        }
      ]
    };
    
    const result = userStreamingHistoryCreateSchema.safeParse(invalidHistory);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Title has to be at least 1 character long');
    }
  });

  it('should reject when watchedDurationInMinutes is negative', () => {
    const objectId = new Types.ObjectId();
    const invalidHistory = {
      userId: objectId,
      watchHistory: [
        {
          contentId: objectId,
          contentType: 'movie',
          title: 'Example Movie',
          watchedDurationInMinutes: -10
        }
      ]
    };
    
    const result = userStreamingHistoryCreateSchema.safeParse(invalidHistory);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Watched duration has to be at least 0 minutes');
    }
  });

  it('should reject when completionPercentage is greater than 100', () => {
    const objectId = new Types.ObjectId();
    const invalidHistory = {
      userId: objectId,
      watchHistory: [
        {
          contentId: objectId,
          contentType: 'movie',
          title: 'Example Movie',
          watchedDurationInMinutes: 120,
          completionPercentage: 101
        }
      ]
    };
    
    const result = userStreamingHistoryCreateSchema.safeParse(invalidHistory);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Completion percentage has to be at most 100%');
    }
  });

  it('should reject when rating is greater than 10', () => {
    const objectId = new Types.ObjectId();
    const invalidHistory = {
      userId: objectId,
      watchHistory: [
        {
          contentId: objectId,
          contentType: 'movie',
          title: 'Example Movie',
          watchedDurationInMinutes: 120,
          rating: 11
        }
      ]
    };
    
    const result = userStreamingHistoryCreateSchema.safeParse(invalidHistory);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Rating has to be at most 10');
    }
  });
});

describe('userStreamingHistoryUpdateSchema', () => {
  it('should validate a complete update object', () => {
    const objectId = new Types.ObjectId();
    const validUpdate = {
      userId: objectId,
      watchHistory: [
        {
          contentId: objectId,
          contentType: 'movie',
          title: 'Updated Movie',
          watchedDurationInMinutes: 150
        }
      ],
      totalWatchTimeInMinutes: 150
    };
    
    const result = userStreamingHistoryUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate a partial update with only watchHistory', () => {
    const objectId = new Types.ObjectId();
    const validUpdate = {
      watchHistory: [
        {
          contentId: objectId,
          contentType: 'movie',
          title: 'New Movie',
          watchedDurationInMinutes: 120
        }
      ]
    };
    
    const result = userStreamingHistoryUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate an empty update object', () => {
    const validUpdate = {};
    
    const result = userStreamingHistoryUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should still validate field constraints', () => {
    const objectId = new Types.ObjectId();
    const invalidUpdate = {
      watchHistory: [
        {
          contentId: objectId,
          contentType: 'movie',
          title: 'Movie',
          watchedDurationInMinutes: -10
        }
      ]
    };
    
    const result = userStreamingHistoryUpdateSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Watched duration has to be at least 0 minutes');
    }
  });
});

describe('userStreamingHistoryAddEntrySchema', () => {
  it('should validate a valid movie entry', () => {
    const objectId = new Types.ObjectId();
    const validEntry = {
      userId: objectId,
      contentId: objectId,
      contentType: 'movie',
      title: 'New Movie',
      watchedDurationInMinutes: 120,
      completionPercentage: 100,
      rating: 9
    };
    
    const result = userStreamingHistoryAddEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it('should validate a valid series entry', () => {
    const objectId = new Types.ObjectId();
    const validEntry = {
      userId: objectId,
      contentId: objectId,
      contentType: 'series',
      title: 'New Series',
      watchedDurationInMinutes: 240,
      seriesProgress: {
        totalEpisodes: 10,
        watchedEpisodes: 5,
        episodesWatched: [
          {
            episodeId: objectId,
            seasonNumber: 1,
            episodeNumber: 1,
            watchedDurationInMinutes: 45
          }
        ],
        completed: false
      }
    };
    
    const result = userStreamingHistoryAddEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it('should reject when required fields are missing', () => {
    const objectId = new Types.ObjectId();
    const invalidEntry = {
      userId: objectId,
      contentId: objectId,
      contentType: 'movie'
      // Missing title and watchedDurationInMinutes
    };
    
    const result = userStreamingHistoryAddEntrySchema.safeParse(invalidEntry);
    expect(result.success).toBe(false);
  });
});

describe('userContentIdentifierSchema', () => {
  it('should validate a valid identifier object', () => {
    const objectId = new Types.ObjectId();
    const validIdentifier = {
      userId: objectId,
      contentId: objectId
    };
    
    const result = userContentIdentifierSchema.safeParse(validIdentifier);
    expect(result.success).toBe(true);
  });

  it('should reject when userId is missing', () => {
    const objectId = new Types.ObjectId();
    const invalidIdentifier = {
      contentId: objectId
    };
    
    const result = userContentIdentifierSchema.safeParse(invalidIdentifier);
    expect(result.success).toBe(false);
  });

  it('should reject when contentId is missing', () => {
    const objectId = new Types.ObjectId();
    const invalidIdentifier = {
      userId: objectId
    };
    
    const result = userContentIdentifierSchema.safeParse(invalidIdentifier);
    expect(result.success).toBe(false);
  });

  it('should reject when IDs are invalid', () => {
    const invalidIdentifier = {
      userId: 'invalid-user-id',
      contentId: 'invalid-content-id'
    };
    
    const result = userContentIdentifierSchema.safeParse(invalidIdentifier);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid ID: must be a valid ObjectId');
    }
  });
});

describe('userStreamingHistoryRemoveEpisodeSchema', () => {
  it('should validate a valid episode removal object', () => {
    const objectId = new Types.ObjectId();
    const validRemoval = {
      userId: objectId,
      contentId: objectId,
      episodeId: objectId
    };
    
    const result = userStreamingHistoryRemoveEpisodeSchema.safeParse(validRemoval);
    expect(result.success).toBe(true);
  });

  it('should reject when episodeId is missing', () => {
    const objectId = new Types.ObjectId();
    const invalidRemoval = {
      userId: objectId,
      contentId: objectId
    };
    
    const result = userStreamingHistoryRemoveEpisodeSchema.safeParse(invalidRemoval);
    expect(result.success).toBe(false);
  });

  it('should reject when episodeId is invalid', () => {
    const objectId = new Types.ObjectId();
    const invalidRemoval = {
      userId: objectId,
      contentId: objectId,
      episodeId: 'invalid-id'
    };
    
    const result = userStreamingHistoryRemoveEpisodeSchema.safeParse(invalidRemoval);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid ID: must be a valid ObjectId');
    }
  });
});

describe('userStreamingHistoryAddEpisodeSchema', () => {
  it('should validate a valid episode addition object', () => {
    const objectId = new Types.ObjectId();
    const validAddition = {
      userId: objectId,
      contentId: objectId,
      episodeData: {
        episodeId: objectId,
        seasonNumber: 1,
        episodeNumber: 5,
        watchedDurationInMinutes: 42,
        completionPercentage: 100
      }
    };
    
    const result = userStreamingHistoryAddEpisodeSchema.safeParse(validAddition);
    expect(result.success).toBe(true);
  });

  it('should reject when episodeData is missing', () => {
    const objectId = new Types.ObjectId();
    const invalidAddition = {
      userId: objectId,
      contentId: objectId
    };
    
    const result = userStreamingHistoryAddEpisodeSchema.safeParse(invalidAddition);
    expect(result.success).toBe(false);
  });

  it('should reject when episodeData is incomplete', () => {
    const objectId = new Types.ObjectId();
    const invalidAddition = {
      userId: objectId,
      contentId: objectId,
      episodeData: {
        episodeId: objectId,
        seasonNumber: 1,
        // Missing episodeNumber
        watchedDurationInMinutes: 42
      }
    };
    
    const result = userStreamingHistoryAddEpisodeSchema.safeParse(invalidAddition);
    expect(result.success).toBe(false);
  });

  it('should reject when watchedDurationInMinutes is negative', () => {
    const objectId = new Types.ObjectId();
    const invalidAddition = {
      userId: objectId,
      contentId: objectId,
      episodeData: {
        episodeId: objectId,
        seasonNumber: 1,
        episodeNumber: 5,
        watchedDurationInMinutes: -10
      }
    };
    
    const result = userStreamingHistoryAddEpisodeSchema.safeParse(invalidAddition);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Watched duration has to be at least 0 minutes');
    }
  });
}); 

describe('userStreamingHistoryMarkSeasonSchema', () => {
  const validId = new Types.ObjectId();

  it('should validate a valid input', () => {
    const validInput = {
      userId: validId,
      contentId: validId,
      seasonNumber: 1
    };

    const result = userStreamingHistoryMarkSeasonSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should fail when userId is missing', () => {
    const input = {
      contentId: validId,
      seasonNumber: 1
    };

    const result = userStreamingHistoryMarkSeasonSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should fail when contentId is missing', () => {
    const input = {
      userId: validId,
      seasonNumber: 1
    };

    const result = userStreamingHistoryMarkSeasonSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should fail when seasonNumber is missing', () => {
    const input = {
      userId: validId,
      contentId: validId
    };

    const result = userStreamingHistoryMarkSeasonSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should fail when seasonNumber is less than 1', () => {
    const input = {
      userId: validId,
      contentId: validId,
      seasonNumber: 0
    };

    const result = userStreamingHistoryMarkSeasonSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should fail when seasonNumber is not a number', () => {
    const input = {
      userId: validId,
      contentId: validId,
      seasonNumber: '1'
    };

    const result = userStreamingHistoryMarkSeasonSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should fail when userId and contentId are invalid strings', () => {
    const input = {
      userId: 'invalid',
      contentId: 'invalid',
      seasonNumber: 2
    };

    const result = userStreamingHistoryMarkSeasonSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.message.includes('Invalid ID'))).toBe(true);
    }
  });
});

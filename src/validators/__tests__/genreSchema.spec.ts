import {
  genreCreateSchema,
  createManyGenreSchema,
  genreUpdateSchema,
  genreByNameSchema
} from '../genreSchema';

describe('genreCreateSchema', () => {
  it('should validate a complete valid genre object', () => {
    const validGenre = {
      name: 'Action',
      id: 1,
      poster: 'http://example.com/poster.jpg'
    };
    
    const result = genreCreateSchema.safeParse(validGenre);
    expect(result.success).toBe(true);
  });

  it('should validate a genre with only required fields', () => {
    const validGenre = {
      name: 'Horror',
      id: 2
    };
    
    const result = genreCreateSchema.safeParse(validGenre);
    expect(result.success).toBe(true);
  });

  it('should reject when name is missing', () => {
    const invalidGenre = {
      id: 3
    };
    
    const result = genreCreateSchema.safeParse(invalidGenre);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Name is required');
    }
  });

  it('should reject when name is too short', () => {
    const invalidGenre = {
      name: 'A',
      id: 4
    };
    
    const result = genreCreateSchema.safeParse(invalidGenre);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Name must have at least 2 characters');
    }
  });

  it('should reject when id is missing', () => {
    const invalidGenre = {
      name: 'Comedy'
    };
    
    const result = genreCreateSchema.safeParse(invalidGenre);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('ID is required');
    }
  });

  it('should reject when id is not a number', () => {
    const invalidGenre = {
      name: 'Drama',
      id: 'five'
    };
    
    const result = genreCreateSchema.safeParse(invalidGenre);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('ID must be a number');
    }
  });

  it('should reject additional fields', () => {
    const invalidGenre = {
      name: 'Science Fiction',
      id: 5,
      extraField: 'should not be allowed'
    };
    
    const result = genreCreateSchema.safeParse(invalidGenre);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Additional fields are not allowed');
    }
  });
});

describe('createManyGenreSchema', () => {
  it('should validate a list with multiple genres', () => {
    const validGenres = {
      genres: [
        { name: 'Action', id: 1 },
        { name: 'Comedy', id: 2 },
        { name: 'Drama', id: 3, poster: 'http://example.com/drama.jpg' }
      ]
    };
    
    const result = createManyGenreSchema.safeParse(validGenres);
    expect(result.success).toBe(true);
  });

  it('should validate a list with a single genre', () => {
    const validGenres = {
      genres: [
        { name: 'Horror', id: 4 }
      ]
    };
    
    const result = createManyGenreSchema.safeParse(validGenres);
    expect(result.success).toBe(true);
  });

  it('should reject an empty genre list', () => {
    const invalidGenres = {
      genres: []
    };
    
    const result = createManyGenreSchema.safeParse(invalidGenres);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('At least one genre must be provided');
    }
  });

  it('should reject when genres is missing', () => {
    const invalidGenres = {};
    
    const result = createManyGenreSchema.safeParse(invalidGenres);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Genre list is required');
    }
  });

  it('should reject when any genre in the list is invalid', () => {
    const invalidGenres = {
      genres: [
        { name: 'Action', id: 1 },
        { name: 'A', id: 2 }, // Name too short
        { name: 'Drama', id: 3 }
      ]
    };
    
    const result = createManyGenreSchema.safeParse(invalidGenres);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Name must have at least 2 characters');
    }
  });
});

describe('genreUpdateSchema', () => {
  it('should validate a complete update object', () => {
    const validUpdate = {
      name: 'Updated Genre',
      id: 10,
      poster: 'http://example.com/new-poster.jpg'
    };
    
    const result = genreUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate partial updates with name only', () => {
    const validUpdate = {
      name: 'New Name'
    };
    
    const result = genreUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate partial updates with id only', () => {
    const validUpdate = {
      id: 20
    };
    
    const result = genreUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate an empty update object', () => {
    const validUpdate = {};
    
    const result = genreUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should still validate field constraints', () => {
    const invalidUpdate = {
      name: 'A' // Too short
    };
    
    const result = genreUpdateSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Name must have at least 2 characters');
    }
  });
});

describe('genreByNameSchema', () => {
  it('should validate a valid name search', () => {
    const validSearch = {
      name: 'Action'
    };
    
    const result = genreByNameSchema.safeParse(validSearch);
    expect(result.success).toBe(true);
  });

  it('should reject when name is missing', () => {
    const invalidSearch = {};
    
    const result = genreByNameSchema.safeParse(invalidSearch);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Name is required');
    }
  });

  it('should reject when name is too short', () => {
    const invalidSearch = {
      name: 'A'
    };
    
    const result = genreByNameSchema.safeParse(invalidSearch);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Name must have at least 2 characters');
    }
  });
}); 
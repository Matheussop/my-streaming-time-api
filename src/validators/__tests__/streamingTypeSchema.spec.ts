import { Types } from 'mongoose';
import {
  streamingTypeCreateSchema,
  streamingTypeUpdateSchema,
  streamingTypeByNameParamSchema,
  streamingTypeAddGenreSchema,
  genreReferenceSchema
} from '../streamingTypeSchema';

describe('genreReferenceSchema', () => {
  it('should validate a valid genre reference with ObjectId string', () => {
    const validGenreRef = {
      _id: '507f1f77bcf86cd799439011',
      id: 1,
      name: 'Action'
    };
    
    const result = genreReferenceSchema.safeParse(validGenreRef);
    expect(result.success).toBe(true);
  });

  it('should validate a valid genre reference with ObjectId instance', () => {
    const objectId = new Types.ObjectId();
    const validGenreRef = {
      _id: objectId,
      id: 1,
      name: 'Action'
    };
    
    const result = genreReferenceSchema.safeParse(validGenreRef);
    expect(result.success).toBe(true);
  });

  it('should reject when _id is invalid', () => {
    const invalidGenreRef = {
      _id: 'invalid-id',
      id: 1,
      name: 'Action'
    };
    
    const result = genreReferenceSchema.safeParse(invalidGenreRef);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid ID: must be a valid ObjectId');
    }
  });

  it('should reject when id is missing', () => {
    const invalidGenreRef = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Action'
    };
    
    const result = genreReferenceSchema.safeParse(invalidGenreRef);
    expect(result.success).toBe(false);
  });

  it('should reject when name is missing', () => {
    const invalidGenreRef = {
      _id: '507f1f77bcf86cd799439011',
      id: 1
    };
    
    const result = genreReferenceSchema.safeParse(invalidGenreRef);
    expect(result.success).toBe(false);
  });
});

describe('streamingTypeCreateSchema', () => {
  it('should validate a complete valid streaming type object', () => {
    const objectId = new Types.ObjectId();
    const validStreamingType = {
      name: 'Netflix',
      supportedGenres: [
        { _id: objectId, id: 1, name: 'Action' },
        { _id: objectId.toString(), id: 2, name: 'Drama' }
      ],
      description: 'Popular streaming service',
      isActive: true
    };
    
    const result = streamingTypeCreateSchema.safeParse(validStreamingType);
    expect(result.success).toBe(true);
  });

  it('should validate a streaming type with only required fields', () => {
    const validStreamingType = {
      name: 'Prime Video'
    };
    
    const result = streamingTypeCreateSchema.safeParse(validStreamingType);
    expect(result.success).toBe(true);
  });

  it('should reject when name is missing', () => {
    const invalidStreamingType = {
      description: 'Missing name field'
    };
    
    const result = streamingTypeCreateSchema.safeParse(invalidStreamingType);
    expect(result.success).toBe(false);
  });

  it('should reject when name is empty', () => {
    const invalidStreamingType = {
      name: ''
    };
    
    const result = streamingTypeCreateSchema.safeParse(invalidStreamingType);
    expect(result.success).toBe(false);
  });

  it('should reject when supportedGenres has invalid genres', () => {
    const invalidStreamingType = {
      name: 'Disney+',
      supportedGenres: [
        { _id: 'invalid-id', id: 1, name: 'Action' }
      ]
    };
    
    const result = streamingTypeCreateSchema.safeParse(invalidStreamingType);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid ID: must be a valid ObjectId');
    }
  });

  it('should reject when description is empty', () => {
    const invalidStreamingType = {
      name: 'HBO Max',
      description: ''
    };
    
    const result = streamingTypeCreateSchema.safeParse(invalidStreamingType);
    expect(result.success).toBe(false);
  });
});

describe('streamingTypeUpdateSchema', () => {
  it('should validate a complete update object', () => {
    const objectId = new Types.ObjectId();
    const validUpdate = {
      name: 'Updated Name',
      supportedGenres: [
        { _id: objectId, id: 1, name: 'Action' }
      ],
      description: 'Updated description',
      isActive: false
    };
    
    const result = streamingTypeUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate an empty update object', () => {
    const validUpdate = {};
    
    const result = streamingTypeUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate partial updates with name only', () => {
    const validUpdate = {
      name: 'New Name'
    };
    
    const result = streamingTypeUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should still validate field constraints', () => {
    const invalidUpdate = {
      name: ''
    };
    
    const result = streamingTypeUpdateSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
  });
});

describe('streamingTypeByNameParamSchema', () => {
  it('should validate a valid name search', () => {
    const validSearch = {
      name: 'Netflix'
    };
    
    const result = streamingTypeByNameParamSchema.safeParse(validSearch);
    expect(result.success).toBe(true);
  });

  it('should reject when name is missing', () => {
    const invalidSearch = {};
    
    const result = streamingTypeByNameParamSchema.safeParse(invalidSearch);
    expect(result.success).toBe(false);
  });

  it('should reject when name is empty', () => {
    const invalidSearch = {
      name: ''
    };
    
    const result = streamingTypeByNameParamSchema.safeParse(invalidSearch);
    expect(result.success).toBe(false);
  });
});

describe('streamingTypeAddGenreSchema', () => {
  it('should validate valid genre additions', () => {
    const objectId = new Types.ObjectId();
    const validAddition = {
      supportedGenres: [
        { _id: objectId, id: 1, name: 'Action' },
        { _id: objectId.toString(), id: 2, name: 'Drama' }
      ]
    };
    
    const result = streamingTypeAddGenreSchema.safeParse(validAddition);
    expect(result.success).toBe(true);
  });

  it('should reject when supportedGenres is missing', () => {
    const invalidAddition = {};
    
    const result = streamingTypeAddGenreSchema.safeParse(invalidAddition);
    expect(result.success).toBe(false);
  });

  it('should reject when any genre in supportedGenres is invalid', () => {
    const invalidAddition = {
      supportedGenres: [
        { _id: 'invalid-id', id: 1, name: 'Action' }
      ]
    };
    
    const result = streamingTypeAddGenreSchema.safeParse(invalidAddition);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid ID: must be a valid ObjectId');
    }
  });
}); 
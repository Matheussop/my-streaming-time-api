import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import StreamingTypes from '../streamingTypesModel';
import Genre from '../genresModel';

describe('StreamingTypes Model', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await StreamingTypes.deleteMany({});
    await Genre.deleteMany({});
  });

  describe('StreamingTypes Creation', () => {
    it('should create a streaming type with supportedGenres successfully', async () => {
      const genreIds = await Genre.create([
        { id: 1, name: 'Action' },
        { id: 2, name: 'Comedy' }
      ]);
      
      const streamingType = new StreamingTypes({
        name: 'Netflix',
        description: 'Streaming service for movies and series',
        supportedGenres: [
          { 
            id: 1, 
            name: 'Action',
            _id: genreIds[0]._id
          },
          { 
            id: 2, 
            name: 'Comedy',
            _id: genreIds[1]._id
          },
        ],
        isActive: true
      });

      const savedStreamingType = await streamingType.save();

      expect(savedStreamingType._id).toBeDefined();
      expect(savedStreamingType.name).toBe('Netflix');
      expect(savedStreamingType.supportedGenres!.length).toBe(2);
      expect(savedStreamingType.supportedGenres![0].id).toBe(1);
      expect(savedStreamingType.supportedGenres![0].name).toBe('Action');
      expect(savedStreamingType.isActive).toBe(true);
      expect(savedStreamingType.createdAt).toBeDefined();
    });

    it('should create a streaming type with minimum required fields', async () => {
      const streamingType = new StreamingTypes({
        name: 'Prime Video',
      });

      const savedStreamingType = await streamingType.save();

      expect(savedStreamingType._id).toBeDefined();
      expect(savedStreamingType.name).toBe('Prime Video');
      expect(savedStreamingType.description).toBe('');
      expect(savedStreamingType.supportedGenres).toEqual([]);
      expect(savedStreamingType.isActive).toBe(true);
    });

    it('should fail validation when name is missing', async () => {
      const streamingType = new StreamingTypes({
        description: 'Streaming service for movies and series',
      });

      let error;
      try {
        await streamingType.save();
      } catch (err: any) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
    });

    it('should fail validation when supportedGenre is missing required fields', async () => {
      const streamingType = new StreamingTypes({
        name: 'Disney+',
        supportedGenres: [{ name: 'Action' }], // Missing 'id'
      });

      let error;
      try {
        await streamingType.save();
      } catch (err: any) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors['supportedGenres.0.id']).toBeDefined();
    });

    it('should enforce unique streaming type names', async () => {
      const streamingType1 = new StreamingTypes({
        name: 'HBO Max',
      });
      const streamingType2 = new StreamingTypes({
        name: 'HBO Max', // Duplicate name
      });

      await streamingType1.save();
      
      let error;
      try {
        await streamingType2.save();
      } catch (err: any) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Duplicate key error code
    });
  });

  describe('StreamingType Static Methods', () => {
    beforeEach(async () => {
      const genres = await Genre.create([
        { id: 1, name: 'Action' },
        { id: 2, name: 'Comedy' },
        { id: 3, name: 'Drama' }
      ]);

      await StreamingTypes.create([
        {
          name: 'Series Streaming',
          description: 'streaming service',
          supportedGenres: [
            { 
              id: 1, 
              name: 'Action',
              _id: genres[0]._id
            },
            { 
              id: 2, 
              name: 'Comedy',
              _id: genres[1]._id
            },
          ],
        },
        {
          name: 'Movie Streaming',
          description: 'movie streaming service',
          supportedGenres: [
            { 
              id: 2, 
              name: 'Comedy',
              _id: genres[1]._id
            },
            { 
              id: 3, 
              name: 'Drama',
              _id: genres[2]._id
            },
          ],
        }
      ]);
    });

    it('should find a streaming type by name using findByName', async () => {

      const foundStreamingType = await StreamingTypes.findByName('series streaming');

      expect(foundStreamingType).toBeDefined();
      expect(foundStreamingType?.name).toBe('Series Streaming');
    });

    it('should find a streaming type by name case insensitive', async () => {
      const foundStreamingType = await StreamingTypes.findByName('movie streaming');

      expect(foundStreamingType).toBeDefined();
      expect(foundStreamingType?.name).toBe('Movie Streaming');
    });

    it('should find streaming types by genre name', async () => {
      const movies = await StreamingTypes.findByName('Series Streaming');
      
      if (!movies) {
        throw new Error('Series Streaming streaming type not found');
      }

      const foundStreamingType = await StreamingTypes.findByGenreName('Action', movies._id.toString());

      expect(foundStreamingType).toBeDefined();
      expect(foundStreamingType?.name).toBe('Series Streaming');
      expect(foundStreamingType?.supportedGenres!.some(genre => genre.name === 'Action')).toBe(true);
    });

    it('should find streaming types by genre name case insensitive', async () => {
      const movies = await StreamingTypes.findByName('Series Streaming');
      
      if (!movies) {
        throw new Error('Series Streaming streaming type not found');
      }

      const foundStreamingType = await StreamingTypes.findByGenreName('action', movies._id.toString());

      expect(foundStreamingType).toBeDefined();
      expect(foundStreamingType?.name).toBe('Series Streaming');
    });

    it('should delete genres by name', async () => {
      const movies = await StreamingTypes.findByName('series streaming');
      
      if (!movies) {
        throw new Error('Series Streaming streaming type not found');
      }

      const updatedStreamingType = await StreamingTypes.deleteByGenresName(['Comedy'], movies._id.toString());

      expect(updatedStreamingType).toBeDefined();
      expect(updatedStreamingType?.supportedGenres!.length).toBe(1);
      expect(updatedStreamingType?.supportedGenres![0].name).toBe('Action');
    });

    it('should delete multiple genres by name', async () => {
      const movies = await StreamingTypes.findByName('Series Streaming');
      
      if (!movies) {
        throw new Error('Series Streaming streaming type not found');
      }

      const updatedStreamingType = await StreamingTypes.deleteByGenresName(['Action', 'Comedy'], movies._id.toString());

      expect(updatedStreamingType).toBeDefined();
      expect(updatedStreamingType?.supportedGenres!.length).toBe(0);
    });

    it('should handle case insensitive genre deletion', async () => {
      const movies = await StreamingTypes.findByName('Series Streaming');
      
      if (!movies) {
        throw new Error('Series Streaming streaming type not found');
      }

      const updatedStreamingType = await StreamingTypes.deleteByGenresName(['action'], movies._id.toString());

      expect(updatedStreamingType).toBeDefined();
      expect(updatedStreamingType?.supportedGenres!.length).toBe(1);
      expect(updatedStreamingType?.supportedGenres![0].name).toBe('Comedy');
    });
  });

  describe('toJSON Transform', () => {
    it('should transform to JSON without __v field', async () => {
      const streamingType = new StreamingTypes({
        name: 'Another Streaming Service',
        description: 'Another streaming service',
      });

      const savedStreamingType = await streamingType.save();
      const streamingTypeJson = savedStreamingType.toJSON();

      expect(streamingTypeJson).toBeDefined();
      expect(streamingTypeJson.name).toBe('Another Streaming Service');
      expect((streamingTypeJson as any).__v).toBeUndefined();
    });
  });
});

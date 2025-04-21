import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Series from '../series/seriesModel';
import Genre from '../genresModel';
import { Types } from 'mongoose';

describe('Series Model Unit Tests', () => {
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
    await Series.deleteMany({});
    await Genre.deleteMany({});
  });

  describe('Series Creation', () => {
    it('should create a series with valid data', async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const validSeries = {
        title: 'Test Series',
        releaseDate: '2024-01-01',
        plot: 'Test plot',
        cast: ['Actor 1', 'Actor 2'],
        rating: 4.5,
        genre: [1],
        url: 'http://example.com',
        totalSeasons: 3,
        totalEpisodes: 24,
        seasonsSummary: [
          {
            seasonId: new Types.ObjectId(),
            seasonNumber: 1,
            title: 'Season 1',
            episodeCount: 8,
            releaseDate: '2024-01-01'
          },
          {
            seasonId: new Types.ObjectId(),
            seasonNumber: 2,
            title: 'Season 2',
            episodeCount: 8,
            releaseDate: '2024-06-01'
          },
          {
            seasonId: new Types.ObjectId(),
            seasonNumber: 3,
            title: 'Season 3',
            episodeCount: 8,
            releaseDate: '2025-01-01'
          }
        ]
      };

      const series = await Series.create(validSeries);

      expect(series.title).toBe(validSeries.title);
      expect(series.rating).toBe(validSeries.rating);
      expect(series.genre).toEqual(expect.arrayContaining([expect.objectContaining({ id: 1, name: 'Action' })]));
      expect(series.totalSeasons).toBe(validSeries.totalSeasons);
      expect(series.totalEpisodes).toBe(validSeries.totalEpisodes);
      expect(series.seasonsSummary!).toHaveLength(3);
      expect(series.seasonsSummary![0].title).toBe('Season 1');
      expect(series.contentType).toBe('series');
    });

    it('should create a series with default values', async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const minimumSeries = {
        title: 'Minimal Series',
        genre: [1],
      };

      const series = await Series.create(minimumSeries);

      expect(series.title).toBe(minimumSeries.title);
      expect(series.totalSeasons).toBe(0);
      expect(series.totalEpisodes).toBe(0);
      expect(series.seasonsSummary).toEqual([]);
      expect(series.contentType).toBe('series');
    });

    it('should fail when creating a series without required fields', async () => {
      const invalidSeries = {
        releaseDate: '2024-01-01',
        plot: 'Test plot',
        totalSeasons: 3,
        totalEpisodes: 24,
      };

      await expect(Series.create(invalidSeries)).rejects.toThrow();
    });

    it('should fail when creating a series with invalid genre', async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const invalidSeries = {
        title: 'Test Series',
        releaseDate: '2024-01-01',
        plot: 'Test plot',
        cast: ['Actor 1'],
        rating: 4.5,
        genre: [999],
        url: 'http://example.com',
        totalSeasons: 3,
        totalEpisodes: 24,
      };

      await expect(Series.create(invalidSeries)).rejects.toThrow();
    });

    it('should fail when creating a series with invalid release date format', async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const invalidSeries = {
        title: 'Test Series',
        releaseDate: '01-01-2024', // Formato inválido
        plot: 'Test plot',
        cast: ['Actor 1'],
        rating: 4.5,
        genre: [1],
        url: 'http://example.com',
        totalSeasons: 3,
        totalEpisodes: 24,
      };

      await expect(Series.create(invalidSeries)).rejects.toThrow();
    });
  });

  describe('Series Update', () => {
    it('should update a series with new information', async () => {
      await Genre.create([
        { id: 1, name: 'Action' },
        { id: 2, name: 'Drama' }
      ]);

      const series = await Series.create({
        title: 'Original Series',
        releaseDate: '2024-01-01',
        genre: [1],
        totalSeasons: 2,
        totalEpisodes: 16
      });

      const updatedData = {
        title: 'Updated Series',
        plot: 'New plot description',
        genre: [2],
        totalSeasons: 3,
        totalEpisodes: 24,
        seasonsSummary: [
          {
            seasonId: new Types.ObjectId(),
            seasonNumber: 1,
            title: 'Season 1',
            episodeCount: 8,
            releaseDate: '2024-01-01'
          }
        ]
      };

      await Series.updateOne({ _id: series._id }, updatedData);
      const updatedSeries = await Series.findById(series._id);

      expect(updatedSeries!.title).toBe(updatedData.title);
      expect(updatedSeries!.plot).toBe(updatedData.plot);
      expect(updatedSeries!.genre[0]).toBe(2);
      expect(updatedSeries!.totalSeasons).toBe(3);
      expect(updatedSeries!.totalEpisodes).toBe(24);
      expect(updatedSeries!.seasonsSummary).toHaveLength(1);
    });
  });

  describe('findByTitle Static Method', () => {
    beforeEach(async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const seriesList = [
        {
          title: 'Breaking Bad',
          releaseDate: '2008-01-20',
          rating: 4.9,
          genre: [1],
          url: 'http://breakingbad.com',
          totalSeasons: 5,
          totalEpisodes: 62
        },
        {
          title: 'Breaking Dawn',
          releaseDate: '2010-05-15',
          rating: 4.2,
          genre: [1],
          url: 'http://breakingdawn.com',
          totalSeasons: 3,
          totalEpisodes: 30
        },
        {
          title: 'Different Series',
          releaseDate: '2024-01-01',
          rating: 4.0,
          genre: [1],
          url: 'http://different.com',
          totalSeasons: 1,
          totalEpisodes: 10
        },
      ];

      await Series.create(seriesList);
    });

    it('should find series by partial title', async () => {
      const series = await Series.findByTitle('Breaking', 0, 10);
      expect(series).toHaveLength(2);
      expect(series![0].title).toMatch(/Breaking/);
    });

    it('should respect skip and limit parameters', async () => {
      const series = await Series.findByTitle('Breaking', 1, 1);
      expect(series).toHaveLength(1);
    });

    it('should return empty array for non-existent title', async () => {
      const series = await Series.findByTitle('NonExistent', 0, 10);
      expect(series).toHaveLength(0);
    });
  });

  describe('findByGenre Static Method', () => {
    beforeEach(async () => {
      await Genre.create([
        { id: 1, name: 'Action' },
        { id: 2, name: 'Drama' }
      ]);

      const seriesList = [
        {
          title: 'Breaking Bad',
          releaseDate: '2008-01-20',
          rating: 4.9,
          genre: [1],
          url: 'http://breakingbad.com',
          totalSeasons: 5,
          totalEpisodes: 62
        },
        {
          title: 'The Crown',
          releaseDate: '2016-11-04',
          rating: 4.7,
          genre: [2],
          url: 'http://thecrown.com',
          totalSeasons: 6,
          totalEpisodes: 60
        },
        {
          title: 'Stranger Things',
          releaseDate: '2016-07-15',
          rating: 4.8,
          genre: [1],
          url: 'http://strangerthings.com',
          totalSeasons: 4,
          totalEpisodes: 34
        },
      ];

      await Series.create(seriesList);
    });

    it('should find series by genre', async () => {
      const series = await Series.findByGenre('Action', 0, 10);
      expect(series).toHaveLength(2);
      expect(series![0].genre[0].name).toBe('Action');
    });

    it('should respect skip and limit parameters', async () => {
      const series = await Series.findByGenre('Action', 1, 1);
      expect(series).toHaveLength(1);
    });
  });

  describe('toJSON Transform', () => {
    it('should convert to JSON', async () => {
      await Genre.create({
        id: 1,
        name: 'Action'
      });

      const series = await Series.create({
        title: 'Test Series',
        releaseDate: '2024-01-01',
        rating: 4.5,
        genre: [1],
        url: 'http://example.com',
        totalSeasons: 2,
        totalEpisodes: 16
      });

      const seriesJSON = series.toJSON();
      expect(seriesJSON).toBeDefined();
      expect((seriesJSON as any).__v).toBeUndefined();
    });
  });
}); 
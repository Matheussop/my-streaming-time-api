import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Season from '../series/season';
import Series from '../series/seriesModel';

describe('Season Model Unit Tests', () => {
  let mongoServer: MongoMemoryServer;
  let seriesId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Season.deleteMany({});
    await Series.deleteMany({});

    // Criar uma série para os testes
    const series = await Series.create({
      title: 'Test Series',
      tmdbId: 1,
      plot: 'Test plot',
      genre: [],
      url: 'http://example.com'
    });

    seriesId = series._id;
  });

  describe('Season Creation', () => {
    it('should create season with valid data', async () => {
      const validSeason = {
        seriesId,
        tmdbId: 1,
        seasonNumber: 1,
        title: 'Season 1',
        plot: 'Season plot',
        releaseDate: '2024-01-01',
        poster: 'http://example.com/poster.jpg',
        episodes: []
      };

      const season = await Season.create(validSeason);

      expect(season.seriesId.toString()).toBe(seriesId.toString());
      expect(season.seasonNumber).toBe(validSeason.seasonNumber);
      expect(season.title).toBe(validSeason.title);
    });

    it('should create season with episodes null', async () => {
      const validSeason = {
        seriesId,
        tmdbId: 1,
        seasonNumber: 1,
        title: 'Season 1',
        plot: 'Season plot',
        releaseDate: '2024-01-01',
        poster: 'http://example.com/poster.jpg',
        episodes: null
      };

      const season = await Season.create(validSeason);

      expect(season.seriesId.toString()).toBe(seriesId.toString());
      expect(season.seasonNumber).toBe(validSeason.seasonNumber);
      expect(season.title).toBe(validSeason.title);
    });

    it('should create season with episodes and update series', async () => {
      const validSeason = {
        seriesId,
        tmdbId: 1,
        seasonNumber: 1,
        title: 'Season 1',
        episodes: [
          {
            episodeNumber: 1,
            title: 'Episode 1',
            plot: 'Episode plot',
            durationInMinutes: 45,
            releaseDate: '2024-01-01'
          }
        ]
      };

      await Season.create(validSeason);

      const seriesAfter = await Series.findById(seriesId);

      expect(seriesAfter).not.toBeNull();
      
      if(seriesAfter) {
      expect(seriesAfter.seasonsSummary).toBeDefined();
      expect(Array.isArray(seriesAfter.seasonsSummary)).toBe(true);
      expect(seriesAfter.seasonsSummary?.length).toBe(1);
      expect(seriesAfter.seasonsSummary?.[0].seasonNumber).toBe(1);
      expect(seriesAfter.seasonsSummary?.[0].title).toBe('Season 1');
      expect(seriesAfter.seasonsSummary?.[0].episodeCount).toBe(1);
      
      expect(seriesAfter.totalSeasons).toBe(1);
      expect(seriesAfter.totalEpisodes).toBe(1);
      }
    });

    it('should fail when creating season without required fields', async () => {
      const invalidSeason = {
        title: 'Season 1'
      };

      await expect(Season.create(invalidSeason)).rejects.toThrow();
    });

    it('should fail when creating season with duplicate season number', async () => {
      await Season.create({
        seriesId,
        tmdbId: 1,
        seasonNumber: 1,
        title: 'Season 1'
      });

      const duplicateSeason = {
        seriesId,
        tmdbId: 2,
        seasonNumber: 1,
        title: 'Season 1 Duplicate'
      };

      await expect(Season.create(duplicateSeason)).rejects.toThrow(/duplicate key error/);
    });
  });

  describe('findBySeriesId Static Method', () => {
    beforeEach(async () => {
      await Season.create([
        {
          seriesId,
          tmdbId: 1,
          seasonNumber: 1,
          title: 'Season 1'
        },
        {
          seriesId,
          tmdbId: 2,
          seasonNumber: 2,
          title: 'Season 2'
        }
      ]);
    });

    it('should find seasons by series id', async () => {
      const seasons = await Season.findBySeriesId(seriesId.toString(), 0, 10);
      expect(seasons).toHaveLength(2);
    });

    it('should respect skip and limit parameters', async () => {
      const seasons = await Season.findBySeriesId(seriesId.toString(), 1, 1);
      expect(seasons).toHaveLength(1);
    });
  });

  describe('findEpisodesBySeasonNumber Static Method', () => {
    beforeEach(async () => {
      await Season.create({
        seriesId,
        tmdbId: 1,
        seasonNumber: 1,
        title: 'Season 1',
        episodes: [
          {
            episodeNumber: 1,
            title: 'Episode 1',
            durationInMinutes: 45
          },
          {
            episodeNumber: 2,
            title: 'Episode 2',
            durationInMinutes: 45
          }
        ]
      });
    });

    it('should find episodes by season number', async () => {
      const season = await Season.findEpisodesBySeasonNumber(seriesId.toString(), 1);
      expect(season).not.toBeNull();
      expect(season!.episodes).toHaveLength(2);
      expect(season!.episodes![0].episodeNumber).toBe(1); 
    });
  });

  describe('Post Save Hook', () => {
    it('should update series summary when season is saved', async () => {
      const season = await Season.create({
        seriesId,
        tmdbId: 1,
        seasonNumber: 1,
        title: 'Season 1',
        episodes: [
          {
            episodeNumber: 1,
            title: 'Episode 1',
            durationInMinutes: 45
          }
        ]
      });

      const updatedSeries = await Series.findById(seriesId);
      expect(updatedSeries!.seasonsSummary).toHaveLength(1);
      expect(updatedSeries!.totalSeasons).toBe(1);
      expect(updatedSeries!.totalEpisodes).toBe(1);
    });

    it('should update series summary when multiple seasons are saved', async () => {
      await Season.create([
        {
          seriesId,
          tmdbId: 1,
          seasonNumber: 1,
          title: 'Season 1',
          episodes: [
            {
              episodeNumber: 1,
              title: 'Episode 1',
              durationInMinutes: 45
            }
          ]
        },
        {
          seriesId,
          tmdbId: 2,
          seasonNumber: 2,
          title: 'Season 2',
          episodes: [
            {
              episodeNumber: 1,
              title: 'Episode 1',
              durationInMinutes: 45
            },
            {
              episodeNumber: 2,
              title: 'Episode 2',
              durationInMinutes: 45
            }
          ]
        }
      ]);

      const updatedSeries = await Series.findById(seriesId);
      expect(updatedSeries!.seasonsSummary).toHaveLength(2);
      expect(updatedSeries!.totalSeasons).toBe(2);
      expect(updatedSeries!.totalEpisodes).toBe(3);
    });
  });

  describe('toJSON Transform', () => {
    it('should convert to JSON', async () => {
      const season = await Season.create({
        seriesId,
        tmdbId: 1,
        seasonNumber: 1,
        title: 'Season 1'
      });

      const seasonJSON = season.toJSON();
      expect(seasonJSON).toBeDefined();
      expect((seasonJSON as any).__v).toBeUndefined();
    });
  });
}); 
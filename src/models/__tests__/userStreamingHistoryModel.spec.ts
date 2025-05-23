import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserStreamingHistory from '../userStreamingHistoryModel';
import Series from '../series/seriesModel';
import User from '../userModel';
import Genre from '../genresModel';
import { StreamingServiceError } from '../../middleware/errorHandler';
import { IUserStreamingHistoryResponse } from '../../interfaces/userStreamingHistory';

interface EpisodeWatched {
  episodeId: string;
  seasonNumber: number;
  episodeNumber: number;
  watchedAt: Date;
  watchedDurationInMinutes: number;
  completionPercentage: number;
}

describe('UserStreamingHistory Model', () => {
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
    await UserStreamingHistory.deleteMany({});
    await Series.deleteMany({});
    await User.deleteMany({});
    await Genre.deleteMany({});
  });

  describe('Basic Model Operations', () => {
    it('should create a user streaming history successfully', async () => {
      const watchHistoryEntry = {
        contentId: new mongoose.Types.ObjectId().toString(),
        contentType: 'movie' as 'movie',
        title: 'Test Movie',
        watchedDurationInMinutes: 120,
        completionPercentage: 100,
        watchedAt: new Date()
      };

      const userHistory = new UserStreamingHistory({
        userId: new mongoose.Types.ObjectId().toString(),
        watchHistory: [watchHistoryEntry],
        totalWatchTimeInMinutes: 120
      });

      const savedHistory = await userHistory.save();

      expect(savedHistory._id).toBeDefined();
      expect(savedHistory.userId).toBe(userHistory.userId);
      expect(savedHistory.watchHistory).toHaveLength(1);
      expect(savedHistory.watchHistory[0].title).toBe('Test Movie');
      expect(savedHistory.totalWatchTimeInMinutes).toBe(120);
      expect(savedHistory.createdAt).toBeDefined();
    });

    it('should fail validation when required fields are missing', async () => {
      const invalidHistory = new UserStreamingHistory({});

      let error;
      try {
        await invalidHistory.save();
      } catch (err: any) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('should validate watchHistory entry fields', async () => {
      const invalidEntry = new UserStreamingHistory({
        userId: new mongoose.Types.ObjectId().toString(),
        watchHistory: [{
          contentType: 'movie' as 'movie',
          title: 'Invalid Movie',
          watchedDurationInMinutes: 120,
          completionPercentage: 100
        }]
      });

      let error;
      try {
        await invalidEntry.save();
      } catch (err: any) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors['watchHistory.0.contentId']).toBeDefined();
    });

    it('should enforce valid contentType values', async () => {
      const invalidContentType = new UserStreamingHistory({
        userId: new mongoose.Types.ObjectId().toString(),
        watchHistory: [{
          contentId: new mongoose.Types.ObjectId().toString(),
          contentType: 'invalid_type',
          title: 'Invalid Content Type',
          watchedDurationInMinutes: 120,
          completionPercentage: 100
        }]
      });

      let error;
      try {
        await invalidContentType.save();
      } catch (err: any) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors['watchHistory.0.contentType']).toBeDefined();
    });

    it('should prevent negative watchedDurationInMinutes', async () => {
      const negativeDuration = new UserStreamingHistory({
        userId: new mongoose.Types.ObjectId().toString(),
        watchHistory: [{
          contentId: new mongoose.Types.ObjectId().toString(),
          contentType: 'movie' as 'movie',
          title: 'Negative Duration',
          watchedDurationInMinutes: -10,
          completionPercentage: 100
        }]
      });

      let error;
      try {
        await negativeDuration.save();
      } catch (err: any) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors['watchHistory.0.watchedDurationInMinutes']).toBeDefined();
    });
  });

  describe('Static Methods', () => {
    let userId: string;
    let movieId: string;
    let seriesId: string;

    beforeEach(async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
      userId = user._id.toString();

      await Genre.create({ id: 1, name: 'Drama' });

      const series = await Series.create({
        title: 'Test Series',
        genre: [1],
        totalSeasons: 2,
        totalEpisodes: 10
      });
      seriesId = series._id.toString();

      movieId = new mongoose.Types.ObjectId().toString();
    });

    it('should be able to create a user streaming history', async () => {
      const watchHistoryEntry = {
        contentId: movieId,
        contentType: 'movie' as 'movie',
        title: 'Added Movie',
        watchedDurationInMinutes: 105,
        completionPercentage: 90
      };
      const userStreamingHistory = await UserStreamingHistory.create({
        userId,
        watchHistory: [watchHistoryEntry]
      });
      expect(userStreamingHistory._id).toBeDefined();
      expect(userStreamingHistory.userId).toBe(userId);
      expect(userStreamingHistory.watchHistory).toHaveLength(1);
    });
    
    it('should be able to fail when watchHistory receives a invalid userId', async () => {
      const watchHistoryEntry = {
        contentId: movieId,
        contentType: 'movie' as 'movie',
        title: 'Added Movie',
        watchedDurationInMinutes: 120,
        completionPercentage: 10
      };
      await expect(UserStreamingHistory.create({
        userId: 'userId_that_does_not_exist_in_database',
        watchHistory: watchHistoryEntry
      })).rejects.toThrow(new StreamingServiceError(
        `Error updating user watch stats:`,
        400
      ));

    });

    it('should add a watch history entry with addWatchHistoryEntry', async () => {
      const entry = {
        contentId: movieId,
        contentType: 'movie' as 'movie',
        title: 'Added Movie',
        watchedDurationInMinutes: 105,
        completionPercentage: 90
      };

      const result = await UserStreamingHistory.addWatchHistoryEntry(userId, entry);

      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(result.watchHistory).toHaveLength(1);
      expect(result.watchHistory[0].contentId).toBe(movieId);
      expect(result.watchHistory[0].title).toBe('Added Movie');
      expect(result.watchHistory[0].watchedAt).toBeDefined();
      expect(result.totalWatchTimeInMinutes).toBe(105);
    });

    it('should retrieve watch history', async () => {
      for (let i = 1; i <= 5; i++) {
        await UserStreamingHistory.addWatchHistoryEntry(userId, {
          contentId: new mongoose.Types.ObjectId().toString(),
          contentType: i % 2 === 0 ? 'movie' : 'series' as 'movie' | 'series',
          title: `Content ${i}`,
          watchedDurationInMinutes: 60,
          completionPercentage: 100
        });
      }

      const history = await UserStreamingHistory.findOne({ userId });
      expect(history).toBeDefined();
      expect(history!.watchHistory.length).toBeGreaterThanOrEqual(5);
    });

    it('should check if content has been watched with hasWatched', async () => {
      await UserStreamingHistory.addWatchHistoryEntry(userId, {
        contentId: movieId,
        contentType: 'movie' as 'movie',
        title: 'Watched Movie',
        watchedDurationInMinutes: 120,
        completionPercentage: 100
      });

      const watchedResult = await UserStreamingHistory.hasWatched(userId, movieId, 'movie');
      const unwatchedResult = await UserStreamingHistory.hasWatched(
        userId, 
        new mongoose.Types.ObjectId().toString(),
        'movie'
      );

      expect(watchedResult).toBe(true);
      expect(unwatchedResult).toBe(false);
    });

    it('should remove a watch history entry with removeWatchHistoryEntry', async () => {
      await UserStreamingHistory.addWatchHistoryEntry(userId, {
        contentId: movieId,
        contentType: 'movie' as 'movie',
        title: 'Movie to Remove',
        watchedDurationInMinutes: 90,
        completionPercentage: 100
      });

      const result = await UserStreamingHistory.removeWatchHistoryEntry(userId, movieId);
      expect(result).toBeDefined();
      expect(result!.watchHistory.find(entry => entry.contentId === movieId)).toBeUndefined();

      const afterRemoval = await UserStreamingHistory.hasWatched(userId, movieId, 'movie');
      expect(afterRemoval).toBe(false);
    });

    it('should be return null when try to remove a episode from history and the findOne fails', async () => {
      await UserStreamingHistory.create({
        userId,
        watchHistory: [
          {
            contentId: seriesId,
            contentType: 'series' as 'series',
            title: 'Series to Remove',
            watchedDurationInMinutes: 90,
            completionPercentage: 100,
            seriesProgress: null
          }
        ]
      });

      jest.spyOn(UserStreamingHistory, 'findOne').mockResolvedValueOnce(null);

      const result = await UserStreamingHistory.removeEpisodeFromHistory(userId, seriesId, 'episodeId');
      expect(result).toBeNull();
    });

    it('should be return null when try to remove a episode from history without seriesProgress in database', async () => {
      await UserStreamingHistory.create({
        userId,
        watchHistory: [
          {
            contentId: seriesId,
            contentType: 'series' as 'series',
            title: 'Series to Remove',
            watchedDurationInMinutes: 90,
            completionPercentage: 100,
            seriesProgress: null
          }
        ]
      });

      const result = await UserStreamingHistory.removeEpisodeFromHistory(userId, seriesId, 'episodeId');
      expect(result).toBeNull();
    });

    it('should be return null when try to remove a episode from history without at least one episode watched in seriesProgress', async () => {
      await UserStreamingHistory.create({
        userId,
        watchHistory: [
          {
            contentId: seriesId,
            contentType: 'series' as 'series',
            title: 'Series to Remove',
            watchedDurationInMinutes: 90,
            completionPercentage: 100,
            seriesProgress: new Map([
              ['no_same_id', {
                watchedEpisodes: 0,
                episodesWatched: new Map(),
                lastWatched: null
              }]
            ])
          }
        ]
      })

      const result = await UserStreamingHistory.removeEpisodeFromHistory(userId, seriesId, 'episodeId');
      expect(result).toBeNull();
    })

    it('should be return null when try to remove a episode from history without at least one episode with a episodeId that matches', async () => {
      await UserStreamingHistory.create({
        userId,
        watchHistory: [
          {
            contentId: seriesId,
            contentType: 'series' as 'series',
            title: 'Series to Remove',
            completionPercentage: 100,
            watchedDurationInMinutes: 90,
            seriesProgress: new Map([
              [seriesId, {
                watchedEpisodes: 1,
                episodesWatched: new Map([
                  ['episodeId', {
                    seasonNumber: 1,
                    episodeNumber: 1,
                    completionPercentage: 100
                  }]
                ]),
                lastWatched: null
              }]
            ])
          }
        ]
      })

      const result = await UserStreamingHistory.removeEpisodeFromHistory(userId, seriesId, 'episodeId_that_does_not_exist');
      expect(result).toBeNull();
    })

    it('should be return null when try to remove a episode from history and the database failed to update the seriesProgress', async () => {
      await UserStreamingHistory.create({
        userId,
        watchHistory: [
          {
            contentId: seriesId,
            contentType: 'series' as 'series',
            title: 'Series to Remove',
            completionPercentage: 100,
            watchedDurationInMinutes: 90,
            seriesProgress: new Map([
              [seriesId, {
                watchedEpisodes: 1,
                episodesWatched: new Map([
                  ['episodeId', {
                    seasonNumber: 1,
                    episodeNumber: 1,
                    completionPercentage: 100
                  }]
                ]),
                lastWatched: null
              }]
            ])
          }
        ]
      })

      jest.spyOn(UserStreamingHistory, 'findOneAndUpdate').mockResolvedValueOnce(null);

      const result = await UserStreamingHistory.removeEpisodeFromHistory(userId, seriesId, 'episodeId');
      expect(result).toBeNull();
    })

    it('should be return null when try to remove a episode from history and the database return a object with invalid watchHistory', async () => {
      const watchHistory = [
        {
          contentId: seriesId,
          contentType: 'series' as 'series',
          title: 'Series to Remove',
          completionPercentage: 100,
          watchedDurationInMinutes: 90,
          seriesProgress: new Map([
            [seriesId, {
              watchedEpisodes: 1,
              episodesWatched: new Map([
                ['episodeId', {
                  seasonNumber: 1,
                  episodeNumber: 1,
                  completionPercentage: 100
                }]
              ]),
              lastWatched: null
            }]
          ])
        }
      ]
      await UserStreamingHistory.create({userId, watchHistory})
      
      jest.spyOn(UserStreamingHistory, 'findOneAndUpdate').mockResolvedValueOnce({watchHistory: []});

      const result = await UserStreamingHistory.removeEpisodeFromHistory(userId, seriesId, 'episodeId');
      expect(result).toBeNull();
    })

    it('should be return null when try to remove a watch history entry with a invalid data', async () => {
      await UserStreamingHistory.addWatchHistoryEntry(userId, {
        contentId: movieId,
        contentType: 'movie' as 'movie',
        title: 'Movie to Remove',
        watchedDurationInMinutes: 90,
        completionPercentage: 100
      });

      const invalidContentId = 'invalid_content_id';
      const result = await UserStreamingHistory.removeWatchHistoryEntry(userId, invalidContentId);
      expect(result).toBeNull();
    });
    
    it('should update episode progress with updateEpisodeProgress', async () => {
      const episodeId = new mongoose.Types.ObjectId().toString();
      
      const episodeData: EpisodeWatched = {
        episodeId,
        seasonNumber: 1,
        episodeNumber: 3,
        watchedDurationInMinutes: 45,
        completionPercentage: 100,
        watchedAt: new Date()
      };
      
      const result = await UserStreamingHistory.updateEpisodeProgress(userId, seriesId, episodeData);

      expect(result).toBeDefined();
      expect(result!.contentId).toBe(seriesId);
      expect(result!.contentType).toBe('series');
      
      const seriesProgress = result!.seriesProgress!.get(seriesId);
      expect(seriesProgress).toBeDefined();
      expect(seriesProgress!.watchedEpisodes).toBe(1);
      
      const episodeWatched = seriesProgress!.episodesWatched.get(episodeId);
      expect(episodeWatched).toBeDefined();
      expect(episodeWatched!.seasonNumber).toBe(1);
      expect(episodeWatched!.episodeNumber).toBe(3);

      const updatedEpisodeData: EpisodeWatched = {
        ...episodeData,
        watchedDurationInMinutes: 50,
      };
      
      const updatedResult = await UserStreamingHistory.updateEpisodeProgress(userId, seriesId, updatedEpisodeData);

      const updatedSeriesProgress = updatedResult!.seriesProgress!.get(seriesId);
      expect(updatedSeriesProgress!.watchedEpisodes).toBe(1);
      expect(updatedSeriesProgress!.lastWatched!.episodeId).toBe(episodeId);
    });

    it('should be fail when try to update episode progress with a non existent seriesId', async () => {
      const episodeId = new mongoose.Types.ObjectId().toString();
      const nonExistentSeriesId = new mongoose.Types.ObjectId().toString();
      const episodeData: EpisodeWatched = {
        episodeId,
        seasonNumber: 1,
        episodeNumber: 3,
        watchedDurationInMinutes: 45,
        completionPercentage: 100,
        watchedAt: new Date()
      };
      
      await expect(UserStreamingHistory.updateEpisodeProgress(userId, nonExistentSeriesId, episodeData)).rejects.toThrow(new StreamingServiceError(
        `Series not found`,
        404
      ));

    });

    it('should update episode progress with updateEpisodeProgress', async () => {
      const episodeId = new mongoose.Types.ObjectId().toString();
      
      const episodeData: EpisodeWatched = {
        episodeId,
        seasonNumber: 1,
        episodeNumber: 3,
        watchedDurationInMinutes: 45,
        completionPercentage: 100,
      } as EpisodeWatched;
      
      const result = await UserStreamingHistory.updateEpisodeProgress(userId, seriesId, episodeData);

      expect(result).toBeDefined();
      expect(result!.contentId).toBe(seriesId);
      expect(result!.contentType).toBe('series');
      
      const seriesProgress = result!.seriesProgress!.get(seriesId);
      expect(seriesProgress).toBeDefined();
      expect(seriesProgress!.watchedEpisodes).toBe(1);
      
      const episodeWatched = seriesProgress!.episodesWatched.get(episodeId);
      expect(episodeWatched).toBeDefined();
      expect(episodeWatched!.seasonNumber).toBe(1);
      expect(episodeWatched!.episodeNumber).toBe(3);
    });

    it('should be able to return null when addWatchHistoryEntry failed on updateEpisodeProgress', async () => {
      const episodeId = new mongoose.Types.ObjectId().toString();
      
      const episodeData: EpisodeWatched = {
        episodeId,
        seasonNumber: 1,
        episodeNumber: 3,
        watchedDurationInMinutes: 45,
        completionPercentage: 100,
      } as EpisodeWatched;
      
      const newSeries = await Series.create({
        title: 'Test Series 2',
        genre: [1],
        totalSeasons: 1,
        totalEpisodes: null // series without episodes
      });
      const newSeriesId = newSeries._id.toString();

      jest.spyOn(UserStreamingHistory, 'addWatchHistoryEntry').mockResolvedValueOnce(Promise.resolve(null as unknown as IUserStreamingHistoryResponse));

      const result = await UserStreamingHistory.updateEpisodeProgress(userId, newSeriesId, episodeData);

      expect(result).toBeNull();
    });

    it('should remove an episode from history with removeEpisodeFromHistory', async () => {
      const episodeId = new mongoose.Types.ObjectId().toString();
      
      await UserStreamingHistory.updateEpisodeProgress(userId, seriesId, {
        episodeId,
        seasonNumber: 1,
        episodeNumber: 5,
        watchedDurationInMinutes: 30,
        completionPercentage: 100,
        watchedAt: new Date()
      });

      const result = await UserStreamingHistory.removeEpisodeFromHistory(userId, seriesId, episodeId);

      expect(result).toBeDefined();
      const seriesProgress = result!.seriesProgress!.get(seriesId);
      expect(seriesProgress).toBeDefined();
      expect(seriesProgress!.watchedEpisodes).toBe(0);
      expect(seriesProgress!.episodesWatched.get(episodeId)).toBeUndefined();
    });

    it('should get watched episodes for a series with getWatchedEpisodesForSeries', async () => {
      const episode1 = new mongoose.Types.ObjectId().toString();
      const episode2 = new mongoose.Types.ObjectId().toString();
      
      await UserStreamingHistory.updateEpisodeProgress(userId, seriesId, {
        episodeId: episode1,
        seasonNumber: 1,
        episodeNumber: 1,
        watchedDurationInMinutes: 45,
        completionPercentage: 100,
        watchedAt: new Date()
      });
      
      await UserStreamingHistory.updateEpisodeProgress(userId, seriesId, {
        episodeId: episode2,
        seasonNumber: 1,
        episodeNumber: 2,
        watchedDurationInMinutes: 45,
        completionPercentage: 100,
        watchedAt: new Date()
      });

      const watchedEpisodes = await UserStreamingHistory.getWatchedEpisodesForSeries(userId, seriesId);
      expect(watchedEpisodes).toHaveLength(2);
      expect(watchedEpisodes.some(ep => ep.episodeId === episode1)).toBe(true);
      expect(watchedEpisodes.some(ep => ep.episodeId === episode2)).toBe(true);
    });

    it('should be able to return a empty array when try to get watched episodes for a series with getWatchedEpisodesForSeries and the findOne fails', async () => {
      const episode1 = new mongoose.Types.ObjectId().toString();
      const episode2 = new mongoose.Types.ObjectId().toString();
      
      await UserStreamingHistory.updateEpisodeProgress(userId, seriesId, {
        episodeId: episode1,
        seasonNumber: 1,
        episodeNumber: 1,
        watchedDurationInMinutes: 45,
        completionPercentage: 100,
        watchedAt: new Date()
      });
      
      await UserStreamingHistory.updateEpisodeProgress(userId, seriesId, {
        episodeId: episode2,
        seasonNumber: 1,
        episodeNumber: 2,
        watchedDurationInMinutes: 45,
        completionPercentage: 100,
        watchedAt: new Date()
      });

      jest.spyOn(UserStreamingHistory, 'findOne').mockResolvedValueOnce(null);

      const watchedEpisodes = await UserStreamingHistory.getWatchedEpisodesForSeries(userId, seriesId);
      expect(watchedEpisodes).toEqual([]);
    });

    it('should get watched episodes for a series with getWatchedEpisodesForSeries and the seriesProgress is null', async () => {
      const episodeId = new mongoose.Types.ObjectId().toString();

      await UserStreamingHistory.create({
        userId,
        watchHistory: [
          {
            contentId: seriesId,
            contentType: 'series' as 'series',
            title: 'Series to Remove',
            watchedDurationInMinutes: 90,
            completionPercentage: 100,
            seriesProgress: null
          }
        ]
      })
      
      const watchedEpisodes = await UserStreamingHistory.getWatchedEpisodesForSeries(userId, seriesId);
      expect(watchedEpisodes).toEqual([]);
    });

    it('should to be able get watch history with getWatchHistory', async () => {
      for (let i = 1; i <= 5; i++) {
        await UserStreamingHistory.addWatchHistoryEntry(userId, {
          contentId: new mongoose.Types.ObjectId().toString(),
          contentType: i % 2 === 0 ? 'movie' : 'series' as 'movie' | 'series',
          title: `Content ${i}`,
          watchedDurationInMinutes: 60,
          completionPercentage: 100
        });
      }
      const history = await UserStreamingHistory.getWatchHistory(userId, 1, 5);
      expect(history).toBeDefined();
      expect(history!.entries.length).toBeGreaterThanOrEqual(5);
    });

    it('should to be able get watch history of one contentType with getWatchHistory', async () => {
      for (let i = 1; i <= 5; i++) {
        await UserStreamingHistory.addWatchHistoryEntry(userId, {
          contentId: new mongoose.Types.ObjectId().toString(),
          contentType: 'movie',
          title: `Content ${i}`,
          watchedDurationInMinutes: 60,
          completionPercentage: 100
        });
      }
      const history = await UserStreamingHistory.getWatchHistory(userId, 1, 5, 'movie');
      expect(history).toBeDefined();
      expect(history!.entries.length).toBeGreaterThanOrEqual(5);
    });

    it('should to be able get watch history empty if no contentType entries', async () => {
      const history = await UserStreamingHistory.getWatchHistory(userId, 1, 5, 'movie');
      expect(history).toBeDefined();
      expect(history!.entries.length).toBe(0);
    });

    it('should be able to updateEpisodeProgress with a series that does not have a seriesProgress', async () => {
      await UserStreamingHistory.create({
        userId,
        watchHistory: [
          {
            contentId: seriesId,
            contentType: 'series' as 'series',
            title: 'Series to Remove',
            watchedDurationInMinutes: 90,
            completionPercentage: 100,
            seriesProgress: new Map()
          }
        ]
      })
      
      const episodeId = new mongoose.Types.ObjectId().toString();
      
      const episodeData: EpisodeWatched = {
        episodeId,
        seasonNumber: 1,
        episodeNumber: 3,
        watchedDurationInMinutes: 45,
        completionPercentage: 100,
        watchedAt: new Date()
      };
      
      const result = await UserStreamingHistory.updateEpisodeProgress(userId, seriesId, episodeData);

      expect(result).toBeDefined();
      expect(result!.contentId).toBe(seriesId);
      expect(result!.contentType).toBe('series');
      
      const seriesProgress = result!.seriesProgress!.get(seriesId);
      expect(seriesProgress).toBeDefined();
      expect(seriesProgress!.watchedEpisodes).toBe(1);
      
      const episodeWatched = seriesProgress!.episodesWatched.get(episodeId);
      expect(episodeWatched).toBeDefined();
      expect(episodeWatched!.seasonNumber).toBe(1);
      expect(episodeWatched!.episodeNumber).toBe(3);
    });

    it('should be able to updateEpisodeProgress with a series that does not has a valid seriesProgress', async () => {
      await UserStreamingHistory.create({
        userId,
        watchHistory: [
          {
            contentId: seriesId,
            contentType: 'series' as 'series',
            title: 'Series to Remove',
            watchedDurationInMinutes: 90,
            completionPercentage: 100,
            seriesProgress: null
          }
        ]
      })
      
      const episodeId = new mongoose.Types.ObjectId().toString();
      
      const episodeData: EpisodeWatched = {
        episodeId,
        seasonNumber: 1,
        episodeNumber: 3,
        watchedDurationInMinutes: 45,
        completionPercentage: 100,
        watchedAt: new Date()
      };
      
      await expect(UserStreamingHistory.updateEpisodeProgress(userId, seriesId, episodeData)).rejects.toThrow();
    });
  
    it('should be able to updateEpisodeProgress with a series with a episode already watched', async () => {
      const episodeId = new mongoose.Types.ObjectId().toString();

      await UserStreamingHistory.create({
        userId,
        watchHistory: [
          {
            contentId: seriesId,
            contentType: 'series' as 'series',
            title: 'Series to Remove',
            watchedDurationInMinutes: 90,
            completionPercentage: 100,
            seriesProgress: new Map([
              [seriesId, {
                watchedEpisodes: 1,
                episodesWatched: new Map([
                  [episodeId, {
                    episodeId,
                    seasonNumber: 1,
                    episodeNumber: 3,
                    watchedDurationInMinutes: 45,
                    completionPercentage: 100,
                    watchedAt: new Date()
                  }]
                ])
              }]
            ])
          }
        ]
      })
      
      
      const episodeData: EpisodeWatched = {
        episodeId,
        seasonNumber: 1,
        episodeNumber: 3,
        watchedDurationInMinutes: 45,
        completionPercentage: 100,
        watchedAt: new Date()
      };
      await UserStreamingHistory.updateEpisodeProgress(userId, seriesId, episodeData);

      const result = await UserStreamingHistory.updateEpisodeProgress(userId, seriesId, episodeData);

      expect(result).toBeDefined();
      expect(result!.contentId).toBe(seriesId);
      expect(result!.contentType).toBe('series');
      
      const seriesProgress = result!.seriesProgress!.get(seriesId);
      expect(seriesProgress).toBeDefined();
      expect(seriesProgress!.watchedEpisodes).toBe(1);
      
      const episodeWatched = seriesProgress!.episodesWatched.get(episodeId);
      expect(episodeWatched).toBeDefined();
      expect(episodeWatched!.seasonNumber).toBe(1);
      expect(episodeWatched!.episodeNumber).toBe(3);
    });

    it('should be able to fail when try to updateEpisodeProgress and the findOneAndUpdate fails', async () => {
      const episodeId = new mongoose.Types.ObjectId().toString();

      await UserStreamingHistory.create({
        userId,
        watchHistory: [
          {
            contentId: seriesId,
            contentType: 'series' as 'series',
            title: 'Series to Remove',
            watchedDurationInMinutes: 90,
            completionPercentage: 100,
            seriesProgress: new Map([
              [seriesId, {
                watchedEpisodes: 1,
                episodesWatched: new Map([
                  [episodeId, {
                    episodeId,
                    seasonNumber: 1,
                    episodeNumber: 3,
                    watchedDurationInMinutes: 45,
                    completionPercentage: 100,
                    watchedAt: new Date()
                  }]
                ])
              }]
            ])
          }
        ]
      })

      jest.spyOn(UserStreamingHistory, 'findOneAndUpdate').mockResolvedValueOnce(null);


      const episodeData: EpisodeWatched = {
        episodeId,
        seasonNumber: 1,
        episodeNumber: 3,
        watchedDurationInMinutes: 45,
        completionPercentage: 100,
        watchedAt: new Date()
      };
      await expect(UserStreamingHistory.updateEpisodeProgress(userId, seriesId, episodeData)).rejects.toThrow(new StreamingServiceError(
        `Failed to update episode progress`,
        500
      ));

    });
  });

  describe('toJSON Transform', () => {
    it('should exclude __v field in toJSON transformation', async () => {
      const userHistory = new UserStreamingHistory({
        userId: new mongoose.Types.ObjectId().toString(),
        watchHistory: [{
          contentId: new mongoose.Types.ObjectId().toString(),
          contentType: 'movie' as 'movie',
          title: 'JSON Test Movie',
          watchedDurationInMinutes: 120,
          completionPercentage: 100
        }]
      });

      const savedHistory = await userHistory.save();
      const historyJson = savedHistory.toJSON();

      expect(historyJson).toBeDefined();
      expect(historyJson.userId).toBe(userHistory.userId);
      expect((historyJson as any).__v).toBeUndefined();
    });
  });
});

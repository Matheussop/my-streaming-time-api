import { Schema, model } from 'mongoose';
import { EpisodeWatched, IUserStreamingHistoryCreate, IUserStreamingHistoryDocument, IUserStreamingHistoryModel, IUserStreamingHistoryResponse, SeriesProgress, WatchHistoryEntry } from '../interfaces/userStreamingHistory';
import User from './userModel';
import { ErrorMessages } from '../constants/errorMessages';
import Series from './series/seriesModel';
import { StreamingServiceError } from '../middleware/errorHandler';

const userStreamingHistorySchema = new Schema<IUserStreamingHistoryDocument, IUserStreamingHistoryModel>(
  { 
    userId: {
      type: String,
      required: [true, ErrorMessages.USER_ID_REQUIRED],
      index: true,
    },
    watchHistory: [
      {
        contentId: {
          type: String,
          required: [true, ErrorMessages.HISTORY_CONTENT_ID_REQUIRED],
        },
        contentType: {
          type: String,
          enum: {
            values: ['movie', 'series'],
            message: "validator failed for attribute `{PATH}` with value `{VALUE}`",
          },
          required: [true, ErrorMessages.HISTORY_CONTENT_TYPE_REQUIRED],
        },
        title: {
          type: String,
          required: [true, ErrorMessages.HISTORY_TITLE_REQUIRED],
          trim: true,
        },
        seriesProgress: {
          type: Map,
          of: {
            totalEpisodes: { type: Number, default: 0 },
            watchedEpisodes: { type: Number, default: 0 },
            episodesWatched: { 
              type: Map,
              of: {
                episodeId: String,
                seasonNumber: Number,
                episodeNumber: Number,
                watchedAt: Date,
                watchedDurationInMinutes: Number,
                completionPercentage: Number
              },
              default: {}
            },
            lastWatched: {
              seasonNumber: Number,
              episodeNumber: Number,
              episodeId: String,
              completionPercentage: Number,
              watchedAt: Date
            },
            nextToWatch: {
              seasonNumber: Number,
              episodeNumber: Number,
              episodeId: String
            },
            completed: { type: Boolean, default: false }
          },
          default: {}
        },
        watchedAt: {
          type: Date,
          default: Date.now,
        },
        watchedDurationInMinutes: {
          type: Number,
          required: [true, ErrorMessages.HISTORY_DURATION_REQUIRED],
          min: [0, ErrorMessages.HISTORY_DURATION_NEGATIVE],
        },
        completionPercentage: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
          default: 0,
        },
        rating: {
          type: Number,
          min: 0,
          max: 5,
        },
      },
    ],
    totalWatchTimeInMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Total watch time cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

//TODO verify if this is needed
userStreamingHistorySchema.post('save', async function() {
  if (this.watchHistory) {
    try {
      const newEntries = this.watchHistory.slice(-this.watchHistory.length);
      
      if (newEntries.length > 0) {
        for (const entry of newEntries) {
          const contentTypeMapping: Record<string, 'movie' | 'episode'> = {
            'Movie': 'movie',
            'Series': 'episode'
          };
          
          const mappedContentType = contentTypeMapping[entry.contentType] || 'movie';
          
          await User.updateWatchStats(
            this.userId,
            mappedContentType,
            entry.watchedDurationInMinutes * ((entry.completionPercentage!) / 100)
          );
        }
      }
    } catch (error) {
      throw new StreamingServiceError('Error updating user watch stats:', 400);
    }
  }
});

// Método estático para adicionar uma entrada ao histórico
userStreamingHistorySchema.static('addWatchHistoryEntry', async function(
  userId: string,
  entry: Omit<WatchHistoryEntry, 'watchedAt'> & { watchedAt?: Date }
): Promise<IUserStreamingHistoryResponse> {
  const completeEntry = {
    ...entry,
    watchedAt: entry.watchedAt || new Date()
  };
  
  const userHistory = await this.findOneAndUpdate(
    { userId },
    { 
      $push: { 
        watchHistory: {
          $each: [completeEntry],
          $sort: { watchedAt: -1 },
          $slice: -1000 
        }
      },
      $inc: {
        totalWatchTimeInMinutes: completeEntry.watchedDurationInMinutes
      }
    },
    { 
      new: true, 
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
  
  return userHistory;
});

// Método estático para obter o histórico de visualização paginado
userStreamingHistorySchema.static('getWatchHistory', async function(
  userId: string,
  page: number,
  limit: number,
  contentType?: 'movie' | 'series'
): Promise<{ entries: IUserStreamingHistoryCreate[], total: number, page: number, limit: number }> {
  const skip = (page - 1) * limit;
  
  const query: any = { userId };
  if (contentType) {
    query['watchHistory.contentType'] = contentType;
  }
  
  const [result] = await this.aggregate([
    { $match: query },
    { $unwind: '$watchHistory' },
    ...(contentType ? [{ $match: { 'watchHistory.contentType': contentType } }] : []),
    { $sort: { 'watchHistory.watchedAt': -1 } },
    {
      $facet: {
        entries: [
          { $skip: skip },
          { $limit: limit },
          { $replaceRoot: { newRoot: '$watchHistory' } }
        ],
        total: [{ $count: 'count' }]
      }
    }
  ]);
  
  return {
    entries: result.entries,
    total: result.total.length > 0 ? result.total[0].count : 0,
    page,
    limit
  };
});

// Método estático para verificar se um conteúdo foi assistido
userStreamingHistorySchema.static('hasWatched', async function(
  userId: string,
  contentId: string,
  contentType: string
): Promise<boolean> {
  const result = await this.findOne({
    userId,
    'watchHistory.contentId': contentId,
    'watchHistory.contentType': contentType
  });
  
  return !!result;
});

//TODO remove the logic to retrieve durationToSubtract from the model and move it to the service
userStreamingHistorySchema.static('removeWatchHistoryEntry', async function(
  userId: string,
  contentId: string
): Promise<IUserStreamingHistoryResponse | null> {
  const userHistory = await this.findOne(
    { 
      userId, 
      'watchHistory.contentId': contentId 
    },
    { 'watchHistory.$': 1 }
  );

  if (!userHistory) {
    return null;
  }
  const durationToSubtract = userHistory.watchHistory[0].watchedDurationInMinutes;

  const result = await this.findOneAndUpdate(
    { userId },
    { $pull: { watchHistory: { contentId } }, 
      $inc: {
        totalWatchTimeInMinutes: -durationToSubtract
      }
    },
    { new: true }
  );

  return result;
});

//TODO remove the logic to retrieve durationToSubtract from the model and move it to the service
userStreamingHistorySchema.static('removeEpisodeFromHistory', async function(
  userId: string, 
  contentId: string,
  episodeId: string
): Promise<WatchHistoryEntry | null> {
  const userHistory = await this.findOne({ userId, 'watchHistory.contentId': contentId });

  if (!userHistory) {
    return null;
  }

  const seriesEntry = userHistory.watchHistory.find(entry => entry.contentId.toString() === contentId.toString());
  if (!seriesEntry || !seriesEntry.seriesProgress) {
    return null;
  }

  const seriesProgressMap = seriesEntry.seriesProgress as Map<string, SeriesProgress>; 
  const progress = seriesProgressMap.get(contentId);
  if (!progress || !progress.episodesWatched) {
      return null;
  }

  const episodesWatchedMap = progress.episodesWatched as Map<string, EpisodeWatched>;
  const episodeToRemove = episodesWatchedMap.get(episodeId);

  if (!episodeToRemove) {
    return null; 
  }

  const durationToSubtract = episodeToRemove.watchedDurationInMinutes || 0;

  // Construir o caminho para o episódio e a contagem
  const episodePath = `watchHistory.$[elem].seriesProgress.${contentId}.episodesWatched.${episodeId}`;
  const watchedEpisodesPath = `watchHistory.$[elem].seriesProgress.${contentId}.watchedEpisodes`;

  const result = await this.findOneAndUpdate(
    { userId },
    {
      $unset: { [episodePath]: "" },
      $inc: {
        totalWatchTimeInMinutes: -durationToSubtract, 
        [watchedEpisodesPath]: -1
      }
    },
    {
      new: true,
      arrayFilters: [{ 'elem.contentId': contentId }] 
    }
  );

  if (!result) {
    return null;
  }
  //return the WatchHistoryEntry of contentId modified
  const watchHistoryEntry = result.watchHistory.find(entry => entry.contentId === contentId);
  if (!watchHistoryEntry) {
    return null;
  }
  return watchHistoryEntry;
});

// Método para adicionar ou atualizar o progresso de um episódio
userStreamingHistorySchema.static('updateEpisodeProgress', async function(
  userId: string,
  seriesId: string,
  episodeData: EpisodeWatched
): Promise<WatchHistoryEntry | null> {
  const userHistory = await this.findOne({
    userId,
    'watchHistory.contentId': seriesId,
    'watchHistory.contentType': 'series'
  });
  
  const now = new Date();
  if (!userHistory) {
    const seriesData = await Series.findById(seriesId);
    
    if (!seriesData) {
      throw new StreamingServiceError('Series not found', 404);
    }
    const episodesWatchedMap: Map<string, EpisodeWatched> = new Map();
    episodesWatchedMap.set(episodeData.episodeId, {
      ...episodeData,
      watchedAt: episodeData.watchedAt || now
    });

    const seriesProgress: Map<string, SeriesProgress> = new Map();
    seriesProgress.set(seriesId, {
      totalEpisodes: seriesData.totalEpisodes || 0,
      watchedEpisodes: 1,
      episodesWatched: episodesWatchedMap,
      lastWatched: {
        ...episodeData,
        watchedAt: now
      },
      completed: seriesData.totalEpisodes === 1
    });

    const watchHistoryEntry = await this.addWatchHistoryEntry(userId, {
      contentId: seriesId,
      contentType: 'series',
      title: seriesData.title,
      watchedDurationInMinutes: episodeData.watchedDurationInMinutes,
      completionPercentage: 0,
      seriesProgress
    });

    return watchHistoryEntry?.watchHistory[0] || null;
    
  } else {
    const seriesEntryIndex = userHistory.watchHistory.findIndex(
      entry => entry.contentId.toString() === seriesId.toString() && entry.contentType === 'series'
    );
        
    const seriesProgress = userHistory.watchHistory[seriesEntryIndex].seriesProgress?.get(seriesId) || {
      totalEpisodes: 0,
      watchedEpisodes: 0,
      episodesWatched: [],
      completed: false
    };
    const episodeExists = seriesProgress.episodesWatched instanceof Map
      && (seriesProgress.episodesWatched as Map<string, EpisodeWatched>).has(episodeData.episodeId)

    const now = new Date();
    const episodeToUpdate = {
      ...episodeData,
      watchedAt: now
    };
    
    const seriesEntryPath = `watchHistory.${seriesEntryIndex}.seriesProgress.${seriesId}`;
    
    const updateObj: any = {};
    
    updateObj[`${seriesEntryPath}.lastWatched`] = episodeToUpdate;
    
    if (!episodeExists) {
    // Episódio não assistido anteriormente - incrementar contador
    updateObj[`${seriesEntryPath}.watchedEpisodes`] = (seriesProgress.watchedEpisodes || 0) + 1;
    } 

    updateObj[`${seriesEntryPath}.episodesWatched.${episodeData.episodeId}`] = episodeToUpdate;
    
    // TODO depende de como vamos definir "completionPercentage" para a série
    const updatedHistory = await this.findOneAndUpdate(
      { userId },
      { $set: updateObj },
      { new: true }
    );

    if (!updatedHistory) {
      throw new StreamingServiceError('Failed to update episode progress', 500);
    }
    
    const watchHistoryUpdated = updatedHistory.watchHistory[seriesEntryIndex];
    return watchHistoryUpdated;
  }
});

userStreamingHistorySchema.static("updateSeasonProgress", async function(
  userId: string,
  seriesId: string,
  episodes: EpisodeWatched[]
): Promise<WatchHistoryEntry | null>{
  const userHistory = await this.findOne({
    userId,
    'watchHistory.contentId': seriesId,
    'watchHistory.contentType': 'series'
  });

  const now = new Date();

  const watchedMap = new Map<string, EpisodeWatched>();
  let watchedEpisodesCount = 0;
  for (const ep of episodes) {
    watchedMap.set(ep.episodeId, {
      ...ep,
      watchedAt: ep.watchedAt || now
    });
    watchedEpisodesCount++;
  }

  if(!userHistory) {
    const seriesData = await Series.findById(seriesId);

    const seriesProgress: Map<string, any> = new Map();
    seriesProgress.set(seriesId, {
      totalEpisodes: seriesData?.totalEpisodes || 0,
      watchedEpisodes: watchedEpisodesCount,
      episodesWatched: watchedMap,
      lastWatched: episodes[episodes.length - 1],
      completed: seriesData?.totalEpisodes === watchedEpisodesCount
    });

    const watchedDurationInMinutes = episodes.reduce((sum, e) => sum + (e.watchedDurationInMinutes || 0), 0)

    const entry = await this.addWatchHistoryEntry(userId, {
      contentId: seriesId,
      contentType: 'series',
      title: seriesData?.title || "Unknown Title",
      watchedDurationInMinutes,
      completionPercentage: 0, 
      seriesProgress
    });

    return entry?.watchHistory[0] || null;
  }
  
  // If history already exist update
  const seriesEntryIndex = userHistory.watchHistory.findIndex(
    entry => entry.contentId.toString() === seriesId.toString() && entry.contentType === 'series'
  );
  
  const baseEntryPath = `watchHistory.${seriesEntryIndex}`;   
  const seriesEntryPath = `watchHistory.${seriesEntryIndex}.seriesProgress.${seriesId}`;
  
  const seriesEntry = userHistory.watchHistory[seriesEntryIndex];
  const seriesProgress = seriesEntry.seriesProgress!.get(seriesId);

  const updatedEpisodesMap = new Map(seriesProgress!.episodesWatched);
  let newWatchedCount = 0;
  let addDuration = 0;

  for (const ep of episodes) {
    const alreadyWatched = updatedEpisodesMap.has(ep.episodeId);
    if (!alreadyWatched) {
      newWatchedCount++;
      addDuration += ep.watchedDurationInMinutes;
  
      updatedEpisodesMap.set(ep.episodeId, {
        ...ep,
        watchedAt: ep.watchedAt || now
      });
    }
  }
  
  const updateObj: any = {};
  updateObj[`${seriesEntryPath}.episodesWatched`] = Object.fromEntries(updatedEpisodesMap);
  updateObj[`${seriesEntryPath}.watchedEpisodes`] = (seriesProgress!.watchedEpisodes || 0) + newWatchedCount;
  updateObj[`${seriesEntryPath}.lastWatched`] = episodes[episodes.length - 1];

  const currentDuration = seriesEntry.watchedDurationInMinutes;
  updateObj[`${baseEntryPath}.watchedDurationInMinutes`] = Math.max(currentDuration + addDuration, 0);

  const totalWatchPath = 'totalWatchTimeInMinutes';
  const currentTotalWatch = userHistory.totalWatchTimeInMinutes || 0;
  updateObj[totalWatchPath] = Math.max(currentTotalWatch + addDuration, 0);
  
  const updatedHistory = await this.findOneAndUpdate(
    { userId },
    { $set: updateObj },
    { new: true }
  );

  if (!updatedHistory) throw new StreamingServiceError('Failed to update episode progress', 500);
  
  const watchHistoryUpdated = updatedHistory.watchHistory[seriesEntryIndex];
  return watchHistoryUpdated;
});

userStreamingHistorySchema.static("unMarkSeasonAsWatched", async function(
  userId: string,
  seriesId: string,
  seasonNumber: number,
): Promise<WatchHistoryEntry | null>{
  const userHistory = await this.findOne({
    userId,
    'watchHistory.contentId': seriesId,
    'watchHistory.contentType': 'series'
  });

  if (!userHistory) return null;

  const seriesEntryIndex = userHistory.watchHistory.findIndex(
    entry => entry.contentId.toString() === seriesId.toString()
  );

  const seriesEntry = userHistory.watchHistory[seriesEntryIndex];
  const seriesProgress = seriesEntry.seriesProgress?.get(seriesId);

  if (!seriesProgress) return null;

  const updatedEpisodesMap = new Map(seriesProgress.episodesWatched);
  let removedCount = 0;
  let removedDuration = 0;

  for (const [episodeId, episode] of updatedEpisodesMap) {
    if (episode.seasonNumber === seasonNumber) {
      removedDuration += episode.watchedDurationInMinutes;
      updatedEpisodesMap.delete(episodeId);
      removedCount++;
    }
  }

  const updatedWatchedEpisodes = updatedEpisodesMap.size;
  const lastWatched = Array.from(updatedEpisodesMap.values()).pop() || null;

  const baseEntryPath = `watchHistory.${seriesEntryIndex}`;
  const seriesEntryPath = `${baseEntryPath}.seriesProgress.${seriesId}`;

  const updateObj: any = {};
  updateObj[`${seriesEntryPath}.episodesWatched`] = Object.fromEntries(updatedEpisodesMap);
  updateObj[`${seriesEntryPath}.watchedEpisodes`] = updatedWatchedEpisodes;
  updateObj[`${seriesEntryPath}.lastWatched`] = lastWatched;
  updateObj[`${seriesEntryPath}.completed`] = updatedWatchedEpisodes === seriesProgress.totalEpisodes;

  const currentDuration = seriesEntry.watchedDurationInMinutes;
  updateObj[`${baseEntryPath}.watchedDurationInMinutes`] = Math.max(currentDuration - removedDuration, 0);

  const totalWatchPath = 'totalWatchTimeInMinutes';
  const currentTotalWatch = userHistory.totalWatchTimeInMinutes!;
  updateObj[totalWatchPath] = Math.max(currentTotalWatch - removedDuration, 0);

  const updated = await this.findOneAndUpdate(
    { userId },
    { $set: updateObj },
    { new: true }
  );

  return updated?.watchHistory[seriesEntryIndex] || null;
});

// Método para obter todos os episódios assistidos de uma série
userStreamingHistorySchema.static('getWatchedEpisodesForSeries', async function(
  userId: string,
  seriesId: string
): Promise<any[]> {
  const result = await this.findOne(
    {
      userId,
      'watchHistory.contentId': seriesId,
      'watchHistory.contentType': 'series'
    },
    { 'watchHistory.$': 1 }
  );
  
  if (!result || !result.watchHistory || result.watchHistory.length === 0) {
    return [];
  }
  
  const seriesProgress = result.watchHistory[0].seriesProgress?.get(seriesId);
  return Array.from(seriesProgress?.episodesWatched?.values() || []);
});

// Método para calcular o próximo episódio a assistir
// userStreamingHistorySchema.static('calculateNextEpisode', async function(
//   userId: string,
//   seriesId: string
// ): Promise<any> {
//   // TODO Implement this method
//   // Este método dependeria do seu serviço de séries para obter
//   // a lista completa de episódios e determinar o próximo
//   // na sequência após o último assistido
// });

userStreamingHistorySchema.index({ 'watchHistory.contentId': 1 });
userStreamingHistorySchema.index({ 'watchHistory.watchedAt': -1 });
userStreamingHistorySchema.index({ 'watchHistory.contentType': 1 });


const UserStreamingHistory = model<IUserStreamingHistoryDocument, IUserStreamingHistoryModel>('UserStreamingHistory', userStreamingHistorySchema);

export default UserStreamingHistory;

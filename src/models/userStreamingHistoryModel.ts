import { Schema, model } from 'mongoose';
import { EpisodeWatched, IUserStreamingHistoryCreate, IUserStreamingHistoryDocument, IUserStreamingHistoryModel, IUserStreamingHistoryResponse, SeriesProgress, WatchHistoryEntry } from '../interfaces/userStreamingHistory';
import User from './userModel';
import { ErrorMessages } from '../constants/errorMessages';
import console from 'console';
import Series from './series/seriesModel';

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
            episodesWatched: { // Lista de episódios assistidos
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

userStreamingHistorySchema.post('save', async function() {
  if (this.isModified('watchHistory')) {
    try {
      const newEntries = this.watchHistory.slice(-this.watchHistory.length);
      
      if (newEntries.length > 0) {
        for (const entry of newEntries) {
          const contentTypeMapping: Record<string, 'movie' | 'series'> = {
            'Movie': 'movie',
            'Series': 'series'
          };
          
          const mappedContentType = contentTypeMapping[entry.contentType] || 'movie';
          
          await User.updateWatchStats(
            this.userId,
            mappedContentType,
            entry.watchedDurationInMinutes * ((entry.completionPercentage ?? 0) / 100)
          );
        }
      }
    } catch (error) {
      console.error('Error updating user watch stats:', error);
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
  page: number = 1,
  limit: number = 20,
  contentType?: string
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
    entries: result.entries || [],
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
userStreamingHistorySchema.static('removeEpisodeFromHistory', async function(
  userId: string, 
  contentId: string,
  episodeId: string
): Promise<WatchHistoryEntry | null> {
  // Encontrar o histórico do usuário contendo a série
  const userHistory = await this.findOne({ userId, 'watchHistory.contentId': contentId });

  if (!userHistory) {
    return null;
  }

  // Encontrar a entrada específica da série e o episódio dentro dela
  const seriesEntry = userHistory.watchHistory.find(entry => entry.contentId === contentId);
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

  // Executar a atualização
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
  // Verificar se a série já existe no histórico do usuário
  const userHistory = await this.findOne({
    userId,
    'watchHistory.contentId': seriesId,
    'watchHistory.contentType': 'series'
  });
  
  if (!userHistory) {
    // Se não existir, criar uma nova entrada para a série
    // Primeiro precisamos obter os dados básicos da série
    const seriesData = await Series.findById(seriesId);
    
    if (!seriesData) {
      throw new Error('Series not found');
    }
    const episodesWatchedMap: Map<string, EpisodeWatched> = new Map();
    episodesWatchedMap.set(episodeData.episodeId, {
      episodeId: episodeData.episodeId,
      seasonNumber: episodeData.seasonNumber,
      episodeNumber: episodeData.episodeNumber,
      watchedDurationInMinutes: episodeData.watchedDurationInMinutes,
      completionPercentage: episodeData.completionPercentage,
      watchedAt: episodeData.watchedAt || new Date()
    });

    const seriesProgress: Map<string, SeriesProgress> = new Map();
    seriesProgress.set(seriesId, {
      totalEpisodes: seriesData.totalEpisodes || 0,
      watchedEpisodes: 1,
      episodesWatched: episodesWatchedMap,
      lastWatched: {
        ...episodeData,
        watchedAt: new Date()
      },
      completed: seriesData.totalEpisodes === 1
    });

    const watchHistoryEntry = await this.addWatchHistoryEntry(userId, {
      contentId: seriesId,
      contentType: 'series',
      title: seriesData.title,
      watchedDurationInMinutes: episodeData.watchedDurationInMinutes,
      completionPercentage: 0, // Será calculado depois
      seriesProgress
    });

    return watchHistoryEntry?.watchHistory[0] || null;
    
  } else {
    // Série já existe, atualizar progresso
    const seriesEntryIndex = userHistory.watchHistory.findIndex(
      entry => entry.contentId === seriesId && entry.contentType === 'series'
    );
    
    if (seriesEntryIndex === -1) return null;
    
    const seriesProgress = userHistory.watchHistory[seriesEntryIndex].seriesProgress?.get(seriesId) || {
      totalEpisodes: 0,
      watchedEpisodes: 0,
      episodesWatched: [],
      completed: false
    };
    // Verificar se este episódio já foi assistido
    const episodeExists = Array.isArray(seriesProgress.episodesWatched) 
      ? seriesProgress.episodesWatched.some((ep: EpisodeWatched) => ep.episodeId === episodeData.episodeId)
      : seriesProgress.episodesWatched.has(episodeData.episodeId);

    const now = new Date();
    // Preparar dados para atualização
    const episodeToUpdate = {
      ...episodeData,
      watchedAt: now
    };
    
    // Construir o caminho para atualização
    const seriesEntryPath = `watchHistory.${seriesEntryIndex}.seriesProgress.${seriesId}`;
    
    const updateObj: any = {};
    
    // Atualizar último episódio assistido
    updateObj[`${seriesEntryPath}.lastWatched`] = episodeToUpdate;
    
    // Adicionar ou atualizar episódio na lista de assistidos
    if (!episodeExists) {
    // Episódio não assistido anteriormente - incrementar contador
    updateObj[`${seriesEntryPath}.watchedEpisodes`] = (seriesProgress.watchedEpisodes || 0) + 1;
    } 

    updateObj[`${seriesEntryPath}.episodesWatched.${episodeData.episodeId}`] = episodeToUpdate;
    
    // Calcular e atualizar progresso geral da série
    // TODO depende de como vamos definir "completionPercentage" para a série
    const updatedHistory = await this.findOneAndUpdate(
      { userId },
      { $set: updateObj },
      { new: true }
    );

    if (!updatedHistory) {
      throw new Error('Failed to update episode progress');
    }
    
    const watchHistoryUpdated = updatedHistory.watchHistory[seriesEntryIndex];
    return watchHistoryUpdated;
  }
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
userStreamingHistorySchema.static('calculateNextEpisode', async function(
  userId: string,
  seriesId: string
): Promise<any> {
  // TODO Implement this method
  // Este método dependeria do seu serviço de séries para obter
  // a lista completa de episódios e determinar o próximo
  // na sequência após o último assistido
});

userStreamingHistorySchema.index({ userId: 1 });
userStreamingHistorySchema.index({ 'watchHistory.contentId': 1 });
userStreamingHistorySchema.index({ 'watchHistory.watchedAt': -1 });
userStreamingHistorySchema.index({ 'watchHistory.contentType': 1 });


const UserStreamingHistory = model<IUserStreamingHistoryDocument, IUserStreamingHistoryModel>('UserStreamingHistory', userStreamingHistorySchema);

export default UserStreamingHistory;

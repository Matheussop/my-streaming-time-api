import { Schema, model } from 'mongoose';
import { IUserStreamingHistoryCreate, IUserStreamingHistoryDocument, IUserStreamingHistoryModel, IUserStreamingHistoryResponse, WatchHistoryEntry } from '../interfaces/userStreamingHistory';
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
            episodesWatched: [{ // Lista de episódios assistidos
              episodeId: String,
              seasonNumber: Number,
              episodeNumber: Number,
              watchedAt: Date,
              watchedDurationInMinutes: Number,
              completionPercentage: Number
            }],
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

  if (!userHistory || !userHistory.watchHistory || userHistory.watchHistory.length === 0) {
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

// Método para adicionar ou atualizar o progresso de um episódio
userStreamingHistorySchema.static('updateEpisodeProgress', async function(
  userId: string,
  seriesId: string,
  episodeData: {
    episodeId: string,
    seasonNumber: number,
    episodeNumber: number,
    watchedDurationInMinutes: number,
    completionPercentage: number
  }
): Promise<IUserStreamingHistoryResponse | null> {
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

    return this.addWatchHistoryEntry(userId, {
      contentId: seriesId,
      contentType: 'series',
      title: seriesData.title,
      watchedDurationInMinutes: episodeData.watchedDurationInMinutes,
      completionPercentage: 0, // Será calculado depois
      seriesProgress: new Map([
        [seriesId, {
          totalEpisodes: seriesData.totalEpisodes || 0,
          watchedEpisodes: 1,
          episodesWatched: [{
            ...episodeData,
            watchedAt: new Date()
          }],
          lastWatched: {
            ...episodeData,
            watchedAt: new Date()
          },
          completed: false
        }]
      ])
    });
  } else {
    // Série já existe, atualizar progresso
    const seriesEntryIndex = userHistory.watchHistory.findIndex(
      entry => entry.contentId === seriesId && entry.contentType === 'series'
    );
    
    if (seriesEntryIndex === -1) return userHistory;
    
    const seriesProgress = userHistory.watchHistory[seriesEntryIndex].seriesProgress?.get(seriesId) || {
      totalEpisodes: 0,
      watchedEpisodes: 0,
      episodesWatched: [],
      completed: false
    };
    
    // Verificar se este episódio já foi assistido
    const episodeIndex = seriesProgress.episodesWatched?.findIndex(
      ep => ep.episodeId === episodeData.episodeId
    ) ?? -1;
    
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
    if (episodeIndex === -1) {
      // Episódio não assistido anteriormente
      updateObj[`${seriesEntryPath}.watchedEpisodes`] = (seriesProgress.watchedEpisodes || 0) + 1;
      updateObj[`${seriesEntryPath}.episodesWatched`] = [
        ...(seriesProgress.episodesWatched || []),
        episodeToUpdate
      ];
    } else {
      // Episódio já assistido, atualizar
      updateObj[`${seriesEntryPath}.episodesWatched.${episodeIndex}`] = episodeToUpdate;
    }
    
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
    return updatedHistory;
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
  return seriesProgress?.episodesWatched || [];
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

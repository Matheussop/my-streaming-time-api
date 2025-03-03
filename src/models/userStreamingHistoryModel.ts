import { Schema, model, Document, Model } from 'mongoose';
import { IUserStreamingHistoryCreate, IUserStreamingHistoryResponse, WatchHistoryEntry } from '../interfaces/userStreamingHistory';
import User from './userModel';
import { ErrorMessages } from '../constants/errorMessages';

export type IUserStreamingHistorySchema = Document & IUserStreamingHistoryResponse;

export interface IUserStreamingHistoryModel extends Model<IUserStreamingHistorySchema, {}, {}> {
  addWatchHistoryEntry(userId: string,newWatchEntry: WatchHistoryEntry): Promise<IUserStreamingHistoryResponse>;
}

const userStreamingHistorySchema = new Schema<IUserStreamingHistorySchema>(
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
        episodeId: String,
        seasonNumber: Number,
        episodeNumber: Number,
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
          const contentTypeMapping: Record<string, 'movie' | 'episode'> = {
            'Movie': 'movie',
            'Episode': 'episode'
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
  entry: Omit<IUserStreamingHistorySchema, 'watchedAt'> & { watchedAt?: Date }
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

// Método estático para obter o progresso de visualização de um conteúdo
userStreamingHistorySchema.static('getWatchProgress', async function(
  userId: string,
  contentId: string,
  contentType: string
): Promise<{ completionPercentage: number, stoppedAt: number } | null> {
  const result = await this.findOne(
    {
      userId,
      'watchHistory.contentId': contentId,
      'watchHistory.contentType': contentType
    },
    { 'watchHistory.$': 1 }
  );
  
  if (!result || !result.watchHistory || result.watchHistory.length === 0) {
    return null;
  }
  
  const { completionPercentage, stoppedAt } = result.watchHistory[0];
  return { completionPercentage, stoppedAt };
});

// Hook to automatically update the user's total streaming time
userStreamingHistorySchema.pre('save', function (next) {
  this.totalWatchTimeInMinutes = this.watchHistory.reduce(
    (total, item) => total + item.watchedDurationInMinutes, 
    0
  );
  next();
});


userStreamingHistorySchema.index({ userId: 1 });
userStreamingHistorySchema.index({ 'watchHistory.contentId': 1 });
userStreamingHistorySchema.index({ 'watchHistory.watchedAt': -1 });
userStreamingHistorySchema.index({ 'watchHistory.contentType': 1 });


const UserStreamingHistory = model<IUserStreamingHistorySchema, IUserStreamingHistoryModel>('UserStreamingHistory', userStreamingHistorySchema);

export default UserStreamingHistory;

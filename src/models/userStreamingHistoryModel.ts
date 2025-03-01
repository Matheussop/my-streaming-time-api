import { Schema, model, Document } from 'mongoose';
import { IUserStreamingHistoryCreate } from '../interfaces/userStreamingHistory';

export type IUserStreamingSchema = Document & IUserStreamingHistoryCreate;

const userStreamingHistorySchema = new Schema<IUserStreamingSchema>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    watchHistory: [
      {
        contentId: {
          type: String,
          required: [true, 'Content ID is required'],
        },
        contentType: {
          type: String,
          enum: {
            values: ['movie', 'series'],
            message: "validator failed for attribute `{PATH}` with value `{VALUE}`",
          },
          required: [true, 'Content type is required'],
        },
        title: {
          type: String,
          required: [true, 'Title is required'],
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
          required: [true, 'Duration is required'],
          min: [0, 'Duration cannot be negative'],
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

// Hook to automatically update the user's total streaming time
userStreamingHistorySchema.pre('save', function (next) {
  this.totalWatchTimeInMinutes = this.watchHistory.reduce(
    (total, item) => total + item.watchedDurationInMinutes, 
    0
  );
  next();
});

userStreamingHistorySchema.index({ 'watchHistory.contentId': 1 });
userStreamingHistorySchema.index({ 'watchHistory.watchedAt': -1 });

const UserStreamingHistory = model<IUserStreamingSchema>('UserStreamingHistory', userStreamingHistorySchema);

export default UserStreamingHistory;

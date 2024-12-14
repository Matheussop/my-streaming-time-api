import { Schema, model, Document } from "mongoose";

export interface StreamingHistoryEntry {
  streamingId: string;
  title: string;
  durationInMinutes: number;
}
export interface IUserStreamingHistory extends Document {
  userId: string;
  watchHistory: StreamingHistoryEntry[];
  totalWatchTimeInMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const userStreamingHistorySchema = new Schema<IUserStreamingHistory>(
  {
    userId: { 
      type: String, 
      required: [true, 'User ID is required'],
      index: true // Melhora performance de busca
    },
    watchHistory: [
      {
        streamingId: { 
          type: String, 
          required: [true, 'Streaming ID is required'] 
        },
        title: { 
          type: String, 
          required: [true, 'Title is required'],
          trim: true 
        },
        durationInMinutes: { 
          type: Number, 
          required: [true, 'Duration is required'],
          min: [0, 'Duration cannot be negative'] 
        },
      },
    ],
    totalWatchTimeInMinutes: { 
      type: Number, 
      default: 0,
      min: [0, 'Total watch time cannot be negative']
    },
  },
  { 
    timestamps: true,
    toJSON: { 
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Hook to automatically update the user's total streaming hours
userStreamingHistorySchema.pre("save", function (next) {
  this.totalWatchTimeInMinutes = this.watchHistory.reduce(
    (total, item) => total + item.durationInMinutes,
    0
  );
  next();
});

const UserStreamingHistory = model<IUserStreamingHistory>(
  'UserStreamingHistory',
  userStreamingHistorySchema
);

export default UserStreamingHistory;
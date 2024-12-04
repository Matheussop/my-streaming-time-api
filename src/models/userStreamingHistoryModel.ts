import { Schema, model, Document } from "mongoose";

export interface IUserStreamingHistory extends Document {
  userId: string;
  watchHistory: Array<{
    streamingId: string;
    title: string;
    durationInMinutes: number;
  }>;
  totalWatchTimeInMinutes: number,
}

const userStreamingHistorySchema = new Schema<IUserStreamingHistory>({
  userId: { type: String, required: true },
  watchHistory: [
    {
      streamingId: { type: String, required: true },
      title: { type: String, required: true },
      durationInMinutes: { type: Number, required: true },
    },
  ],
  totalWatchTimeInMinutes: { type: Number, default: 0 },
});

// Hook para atualizar o total de horas de streaming do usuário automaticamente
userStreamingHistorySchema.pre("save", function (next) {
  this.totalWatchTimeInMinutes = this.watchHistory.reduce(
    (total, item) => total + item.durationInMinutes,
    0
  );
  next();
});

const UserStreamingHistory = model<IUserStreamingHistory>(
  "UserStreamingHistory",
  userStreamingHistorySchema
);

export default UserStreamingHistory;
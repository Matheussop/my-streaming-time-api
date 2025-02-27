import mongoose, { Schema, Document } from 'mongoose';

interface ILastRequestTime extends Document {
  lastRequestTime: number;
}

const LastRequestTimeSchema: Schema = new Schema({
  lastRequestTime: { type: Number, required: true }
});

const LastRequestTime = mongoose.model<ILastRequestTime>('LastRequestTime', LastRequestTimeSchema);

export default LastRequestTime;
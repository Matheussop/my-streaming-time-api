import mongoose, { Document, Schema, Model } from 'mongoose';
import { IEpisodesResponse } from '../interfaces/episodes';

export interface IEpisode extends Document, IEpisodesResponse {
  _id: string;
}

export interface IEpisodesMethods {}

export interface IEpisodesModel extends Model<IEpisode, {}, IEpisodesMethods> {
  findByTitle(title: string, skip: number, limit: number): Promise<IEpisodesResponse[] | null>;
}

const episodesSchema = new Schema<IEpisode, IEpisodesModel, IEpisodesMethods>(
  {
    title: { type: String, required: true},
    release_date: { type: String },
    plot: { type: String, default: '' },
    cast: [{ type: String }],
    rating: { type: Number, required: true },
    duration: { type: Number, required: true },
    streamingId: { type: String, required: true },
    background: { type: String },
    poster: { type: String },
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

episodesSchema.static('findByTitle', function (title: string, skip: number, limit: number): Promise<IEpisodesResponse[] | null> {
  return this.find({ title: new RegExp(title, 'i') })
    .skip(skip)
    .limit(limit);
});

const Episodes = mongoose.model<IEpisode, IEpisodesModel>('Episodes', episodesSchema);

export default Episodes;

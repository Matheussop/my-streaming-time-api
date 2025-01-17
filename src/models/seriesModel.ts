import mongoose, { Document, Schema, Model } from 'mongoose';
import StreamingTypes from './streamingTypesModel';
import { ErrorMessages } from '../constants/errorMessages';
import { ISeriesResponse } from '../interfaces/series';

export interface ISerie extends Document, ISeriesResponse {
  _id: string;
}

export interface ISeriesMethods {}

export interface ISeriesModel extends Model<ISerie, {}, ISeriesMethods> {
  findByTitle(title: string, skip: number, limit: number): Promise<ISeriesResponse[] | null>;
  findByGenre(genre_id: number, skip: number, limit: number): Promise<ISeriesResponse[] | null>;
}

const seriesSchema = new Schema<ISerie, ISeriesModel, ISeriesMethods>(
  {
    title: { type: String, required: [true, ErrorMessages.SERIES_TITLE_REQUIRED] },
    release_date: { type: String },
    plot: { type: String, default: '' },
    cast: [{ type: String }],
    numberEpisodes: { type: Number, required: [true, ErrorMessages.SERIES_NUMBER_OF_EPISODES_REQUIRED]},
    numberSeasons: { type: Number, required: [true, ErrorMessages.SERIES_NUMBER_OF_SEASONS_REQUIRED] },
    rating: { type: Number, required: true },
    genre: {
      type: [Number],
      required: true,
      validate: {
        validator: async function (categoriesIds: number[]) {
          const result = await Promise.all(
            categoriesIds.map(async (category_id: number) => {
              const streamingTypes = await StreamingTypes.find();
              const categories = streamingTypes.flatMap((type) => type.categories);
              return categories.some((category: any) => category.id === category_id);
            }),
          );
          return result.every((isValid) => isValid === true);
        },
        message: (props: any) => `The genre(s) ${props.value} is/are not valid or not registered in the database!`,
      },
    },
    url: { type: String },
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

seriesSchema.static('findByTitle', function (title: string, skip: number, limit: number): Promise<ISeriesResponse[] | null> {
  return this.find({ title: new RegExp(title, 'i') })
    .skip(skip)
    .limit(limit);
});

seriesSchema.static('findByGenre', function (genre: string, skip: number, limit: number): Promise<ISeriesResponse[] | null> {
  return this.find({ genre }).skip(skip).limit(limit);
});

const Series = mongoose.model<ISerie, ISeriesModel>('Series', seriesSchema);

export default Series;

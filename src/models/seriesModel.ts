import mongoose, { Document, Schema, Model } from 'mongoose';
import StreamingTypes from './streamingTypesModel';
import { ErrorMessages } from '../constants/errorMessages';
import { ISeriesResponse, IGenre } from '../interfaces/series';
import { StreamingServiceError } from '../middleware/errorHandler';

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
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (value: any) {
          if (!Array.isArray(value)) return false;
          if (value.length === 0) return true; // Allow empty arrays
          const isNumberArray = typeof value[0] === 'number';
          return isNumberArray;
        },
        message: 'Genre must be an array of numbers',
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

seriesSchema.pre('save', async function (next) {
  const series = this;
  const streamingTypes = await StreamingTypes.find();
  const categories = streamingTypes.flatMap((type) => type.categories);

  const invalidIds: number[] = [];
  series.genre = series.genre.map((genreId: number | IGenre) => {
    const category = categories.find((category: any) => category.id === genreId);
    if (category) {
      return { id: category.id, name: category.name };
    } else {
      invalidIds.push(genreId as number);
      return null;
    }
  }).filter((genreItem) => genreItem !== null);

  if (invalidIds.length > 0) {
    return next(new StreamingServiceError(`The genre(s) ${invalidIds.join(', ')} is/are not valid or not registered in the database!`, 400));
  }

  next();
});

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

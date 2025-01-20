import mongoose, { Document, Schema, Model } from 'mongoose';
import StreamingTypes from './streamingTypesModel';
import { ErrorMessages } from '../constants/errorMessages';
import { StreamingServiceError } from '../middleware/errorHandler';

interface IGenre {
  id: number;
  name: string;
}
export interface IMovie extends Document {
  _id: string;
  title: string;
  release_date: string;
  plot: string;
  cast: string[];
  rating: number;
  genre: number[] | IGenre[];
  poster: string;
  url: string;
}

export interface IMovieMethods {}

export interface IMovieModel extends Model<IMovie, {}, IMovieMethods> {
  findByTitle(title: string, skip: number, limit: number): Promise<IMovie[] | null>;
  findByGenre(genre_id: number, skip: number, limit: number): Promise<IMovie[] | null>;
}

const movieSchema = new Schema<IMovie, IMovieModel, IMovieMethods>(
  {
    title: { type: String, required: [true, ErrorMessages.MOVIE_TITLE_REQUIRED] },
    release_date: { type: String },
    plot: { type: String, default: '' },
    cast: [{ type: String }],
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
    poster: { type: String },
    url: { type: String, required: true },
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

movieSchema.pre('save', async function (next) {
  const movie = this;
  const streamingTypes = await StreamingTypes.find();
  const categories = streamingTypes.flatMap((type) => type.categories);

  const invalidIds: number[] = [];
  movie.genre = movie.genre.map((genreId: number | IGenre) => {
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

movieSchema.static('findByTitle', function (title: string, skip: number, limit: number): Promise<IMovie[] | null> {
  return this.find({ title: new RegExp(title, 'i') })
    .skip(skip)
    .limit(limit);
});

movieSchema.static('findByGenre', function (genre: string, skip: number, limit: number): Promise<IMovie[] | null> {
  return this.find({ genre }).skip(skip).limit(limit);
});

const Movie = mongoose.model<IMovie, IMovieModel>('Movie', movieSchema);

export default Movie;

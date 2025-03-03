import mongoose, { Document, Schema, Model } from 'mongoose';
import Genre from './genresModel'
import { ErrorMessages } from '../constants/errorMessages';
import { StreamingServiceError } from '../middleware/errorHandler';
import { IGenreCreate } from '../interfaces/genres';

export interface IMovie extends Document {
  _id: string;
  tmdbId: number;
  title: string;
  release_date: string;
  plot: string;
  cast: string[];
  rating: number;
  genre: number[] | IGenreCreate[];
  durationTime: number;
  status: string;
  poster: string;
  url: string;
}

export interface IMovieMethods {}

export interface IMovieModel extends Model<IMovie, {}, IMovieMethods> {
  findByTitle(title: string, skip: number, limit: number): Promise<IMovie[] | null>;
  findByGenre(genre: string, skip: number, limit: number): Promise<IMovie[] | null>;
}

const movieSchema = new Schema<IMovie, IMovieModel, IMovieMethods>(
  {
    tmdbId: { type: Number },
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
          const isObjectArray = typeof value[0] === 'object' && value[0] !== null && 'id' in value[0] && 'name' in value[0];
          return isNumberArray || isObjectArray;
        },
        message: 'Genre must be an array of numbers or an array of objects with id and name properties',
      },
    },
    durationTime: { type: Number },
    status: { type: String, default: 'Released' },
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

movieSchema.pre('insertMany', async function (next, docs) {
  const genres = await Genre.find().lean();

  for (const movie of docs) {
    const invalidIds: number[] = [];
    movie.genre = movie.genre.map((genreId: number | IGenreCreate) => {
      const category = genres.find((category: any) => category.id === genreId);
      if (category) {
        return { id: category.id, name: category.name };
      } else {
        invalidIds.push(genreId as number);
        return null;
      }
    }).filter((genreItem: { id: number; name: string } | null) => genreItem !== null);

    if (invalidIds.length > 0) {
      return next(new StreamingServiceError(`The genre(s) ${invalidIds.join(', ')} is/are not valid or not registered in the database!`, 400));
    }
  }

  next();
});

movieSchema.pre('save', async function (next) {
  const movie = this;
  const genres = await Genre.find().lean();

  const invalidIds: number[] = [];
  movie.genre = movie.genre.map((genreId: number | IGenreCreate) => {
    const category = genres.find((category: any) => category.id === genreId);
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

movieSchema.static('findByGenre', function (genreName: string, skip: number, limit: number): Promise<IMovie[] | null> {
  return this.find({ genre: { $elemMatch: { name: genreName } } })
  .skip(skip).limit(limit);
});

const Movie = mongoose.model<IMovie, IMovieModel>('Movie', movieSchema);

export default Movie;

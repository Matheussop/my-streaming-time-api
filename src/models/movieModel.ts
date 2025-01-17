import mongoose, { Document, Schema, Model } from 'mongoose';
import StreamingTypes from './streamingTypesModel';
import { ErrorMessages } from '../constants/errorMessages';

export interface IMovie extends Document {
  _id: string;
  title: string;
  release_date: string;
  plot: string;
  cast: string[];
  rating: number;
  genre: number[];
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

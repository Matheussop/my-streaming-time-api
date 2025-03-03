import mongoose, { Document, Model, Schema } from 'mongoose';
import { IGenreResponse } from '../interfaces/genres';
import { ErrorMessages } from '../constants/errorMessages';

type IGenreSchema = Document & IGenreResponse;

export interface IGenreModel extends Model<IGenreSchema, {}, {}> {
  findByName(name: string): Promise<IGenreResponse | null>;
}

const genreSchema = new Schema<IGenreSchema>(
  {
    id: {
      type: Number,
      required: [true, ErrorMessages.GENRE_ID_REQUIRED],
      unique: true,
    },
    name: {
      type: String,
      required: [true, ErrorMessages.GENRE_NAME_REQUIRED],
      trim: true,
      unique: true,
    },
    poster: {
      type: String,
      default: '',
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
  }
);

genreSchema.index({ name: 1 });
genreSchema.index({ id: 1 });


genreSchema.static('findByName', function(name: string): Promise<IGenreResponse | null> {
  return this.findOne({ name: new RegExp(`^${name}$`, 'i') });
});

const Genre = mongoose.model<IGenreSchema, IGenreModel>('Genre', genreSchema);

export default Genre;
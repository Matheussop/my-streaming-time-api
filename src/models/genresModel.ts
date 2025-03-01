import mongoose, { Document, Model, Schema } from 'mongoose';
import { IGenreCreate, IGenreResponse } from '../interfaces/genres';

type IGenreSchema = Document & IGenreCreate

export interface IStreamingTypeModel extends Model<IGenreSchema, {}, {}> {
  findByName(name: string): Promise<IGenreResponse | null>;
}

const genreSchema = new Schema<IGenreSchema>(
  {
    id: {
      type: Number,
      required: [true, 'Genre ID is required'],
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Genre name is required'],
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

genreSchema.post('findOneAndUpdate', async function(doc) {
  const update = this.getUpdate() as { $set?: { name?: string } };

  if (update?.$set?.name) {
    const newName = update.$set.name;
    
    const Series = mongoose.model('Series');
    await Series.updateMany(
      { 'genre._id': doc._id },
      { $set: { 'genre.$.name': newName } }
    );
  }
});

const Genre = mongoose.model<IGenreSchema, IStreamingTypeModel>('Genre', genreSchema);

export default Genre;
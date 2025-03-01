import mongoose, { Document, Model, Schema } from 'mongoose';
import { ErrorMessages } from '../constants/errorMessages';
import { IStreamingTypeResponse } from '../interfaces/streamingTypes';

type IStreamingTypeSchema = Document & IStreamingTypeResponse;

export interface IStreamingTypeModel extends Model<IStreamingTypeSchema, {}, {}> {
  findByName(name: string): Promise<IStreamingTypeResponse | null>;
}

const streamingTypesSchema = new Schema<IStreamingTypeSchema>(
  {
    name: {
      type: String,
      required: [true, ErrorMessages.STREAMING_TYPE_NAME_REQUIRED],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    supportedGenres: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Genre',
    }],
    isActive: {
      type: Boolean,
      default: true,
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

streamingTypesSchema.static('findByGenreId', function(genreId: string): Promise<IStreamingTypeResponse[]> {
  return this.find({ supportedGenres: genreId });
});

const StreamingTypes = mongoose.model<IStreamingTypeSchema, IStreamingTypeModel>('StreamingType', streamingTypesSchema);

export default StreamingTypes;

import mongoose, { Schema } from 'mongoose';
import { ErrorMessages } from '../constants/errorMessages';
import { IStreamingTypeDocument, IStreamingTypeModel, IStreamingTypeResponse } from '../interfaces/streamingTypes';

const streamingTypesSchema = new Schema<IStreamingTypeDocument, IStreamingTypeModel>(
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
      id: {
        type: Number,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Genre',
      },
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

streamingTypesSchema.static('findByName', function(name: string): Promise<IStreamingTypeResponse | null> {
  return this.findOne({ name: new RegExp(`^${name}$`, 'i') });
});

streamingTypesSchema.static('findByGenreId', function(genreId: string): Promise<IStreamingTypeResponse[]> {
  return this.find({ supportedGenres: genreId });
});

streamingTypesSchema.static('findByGenreName', function(genreName: string, id: string): Promise<IStreamingTypeResponse | null> {
  return this.findOne({ supportedGenres: { $elemMatch: { name: new RegExp(`^${genreName}$`, 'i') } } });
});

const StreamingTypes = mongoose.model<IStreamingTypeDocument, IStreamingTypeModel>('StreamingType', streamingTypesSchema);

export default StreamingTypes;

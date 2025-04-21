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
      poster: {
        type: String,
        default: '',
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

streamingTypesSchema.index({ name: 1 }, { unique: true });
streamingTypesSchema.index({ 'supportedGenres.name': 1 });

streamingTypesSchema.static('findByName', function(name: string): Promise<IStreamingTypeResponse | null> {
  return this.findOne({ name: new RegExp(`^${name}$`, 'i') });
});

streamingTypesSchema.static('findByGenreName', function(genreName: string, id: string): Promise<IStreamingTypeResponse | null> {
  return this.findOne({ 
    _id: id, 
    'supportedGenres.name': new RegExp(`^${genreName}$`, 'i') 
  });
});

streamingTypesSchema.static('deleteByGenresName', function(genresName: string[], id: string): Promise<IStreamingTypeResponse | null> {
  const regexPatterns = genresName.map(name => new RegExp(`^${name}$`, 'i'));
  
  return this.findOneAndUpdate(
    { _id: id }, 
    { 
      $pull: { 
        supportedGenres: { 
          name: { $in: regexPatterns } 
        } 
      } 
    }, 
    { 
      new: true,
      runValidators: false
    }
  );
});

const StreamingTypes = mongoose.model<IStreamingTypeDocument, IStreamingTypeModel>('StreamingType', streamingTypesSchema);

export default StreamingTypes;

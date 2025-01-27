import mongoose, { Document, Model, Schema } from 'mongoose';
import { ErrorMessages } from '../constants/errorMessages';
import { IStreamingTypeResponse } from '../interfaces/streamingTypes';

export interface ICategory { // TODO Remover esse ICategory e utilizar apenas o da interface
  id: number;
  name: string;
  poster?: string;
}

export interface IStreamingType extends Document, IStreamingTypeResponse {
  _id: string;
}

export interface IStreamingTypeModel extends Model<IStreamingType, {}, {}> {
  findByName(category: string): Promise<IStreamingType | null>;
}

const categorySchema = new Schema<ICategory>({
  id: {
    type: Number,
    required: [true, ErrorMessages.STREAMING_TYPE_CATEGORIES_INVALID_ID],
  },
  name: {
    type: String,
    required: [true, ErrorMessages.STREAMING_TYPE_CATEGORIES_NAME_REQUIRED],
    trim: true,
  },
  poster: {
    type: String,
    trim: true,
  }
});

const streamingTypesSchema = new Schema<IStreamingType, IStreamingTypeModel>(
  {
    name: {
      type: String,
      required: [true, ErrorMessages.STREAMING_TYPE_NAME_REQUIRED],
      unique: true,
      trim: true,
    },
    categories: [categorySchema],
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

streamingTypesSchema.static('findByName', function (name: string) {
  return this.findOne({ name: new RegExp(name, 'i') });
});

const StreamingTypes = mongoose.model<IStreamingType, IStreamingTypeModel>('StreamingType', streamingTypesSchema);

export default StreamingTypes;

import mongoose, { Document, Schema } from 'mongoose';
import { ErrorMessages } from '../constants/errorMessages';

export interface ICategory {
  id: number;
  name: string;
}

export interface IStreamingType extends Document {
  _id: string;
  name: string;
  categories: ICategory[];
  createdAt: Date;
  updatedAt: Date;
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
});

const streamingTypesSchema = new Schema<IStreamingType>(
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

const StreamingTypes = mongoose.model<IStreamingType>('StreamingType', streamingTypesSchema);

export default StreamingTypes;

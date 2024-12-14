import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory {
  id: number;
  name: string;
}

export interface IStreamingType extends Document {
  _id: string;
  name: string;
  categories:ICategory[];
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
  id: { 
    type: Number, 
    required: [true, 'Category ID is required'],
  },
  name: { 
    type: String, 
    required: [true, 'Category name is required'],
    trim: true 
  }
});

const streamingTypesSchema = new Schema<IStreamingType>(
  {
    name: { 
      type: String, 
      required: [true, 'Name is required'],
      unique: true,
      trim: true 
    },
    categories: [categorySchema]
  },
  { 
    timestamps: true,
    toJSON: { 
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

const StreamingTypes = mongoose.model<IStreamingType>('StreamingType', streamingTypesSchema);

export default StreamingTypes;

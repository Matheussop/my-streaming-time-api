import mongoose, { Document, Schema } from 'mongoose';

export interface IStreamingType extends Document {
  name: string;
  categories: Array<{
    id: Number;
    name: string;
  }>;
}

const streamingTypesSchema: Schema = new Schema({
  name: { type: String, required: true },
  categories: [
    {
      id: { type: Number, required: true },
      name: { type: String, required: true },
    },
  ], 
});

const StreamingTypes = mongoose.model<IStreamingType>('StreamingType', streamingTypesSchema);

export default StreamingTypes;

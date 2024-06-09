import mongoose, { Document, Schema } from 'mongoose';

interface IStreamingType extends Document {
  name: string;
  categories: Array<string>; 
}

const streamingTypesSchema: Schema = new Schema({
  name: { type: String, required: true },
  categories: { type: [String], required: true }, 
});

const StreamingTypes = mongoose.model<IStreamingType>('StreamingType', streamingTypesSchema);

export default StreamingTypes;

import mongoose, { Document, Schema } from 'mongoose';
import StreamingTypes from './streamingTypesModel';

interface IMovie extends Document {
  title: string;
  release_date: string;
  plot: string;
  cast: string[];
  rating: number;
  genre: string;
  url: string;
}

const movieSchema: Schema = new Schema({
  title: { type: String, required: true },
  release_date: { type: String },
  plot: { type: String, default: "" },
  cast: [{ type: String }],
  rating: { type: Number, required: true },
  genre: { type: String, required: true,
    validate: {
      validator: async function(value: string) {
        const streamingTypes = await StreamingTypes.find();
        const categories = streamingTypes.flatMap(type => type.categories);
        return categories.includes(value);
      },
      message: (props: any) => `${props.value} is not a valid genre!`
    }
   },
  url: { type: String, required: true },
});

const Movie = mongoose.model<IMovie>('Movie', movieSchema);

export default Movie;

import mongoose, { Document, Schema } from 'mongoose';

interface IMovie extends Document {
  title: string;
  year: number;
  plot: string;
  cast: string[];
  rating: number;
  url: string;
}

const movieSchema: Schema = new Schema({
  title: { type: String, required: true },
  year: { type: Number, required: true },
  plot: { type: String, required: true },
  cast: [{ type: String }],
  rating: { type: Number, required: true },
  url: { type: String, required: true },
});

const Movie = mongoose.model<IMovie>('Movie', movieSchema);

export default Movie;

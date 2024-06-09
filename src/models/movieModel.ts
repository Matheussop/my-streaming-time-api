import mongoose, { Document, Schema } from 'mongoose';

interface IMovie extends Document {
  title: string;
  release_date: string;
  plot: string;
  cast: string[];
  rating: number;
  url: string;
}

const movieSchema: Schema = new Schema({
  title: { type: String, required: true },
  release_date: { type: String, required: true },
  plot: { type: String, default: "" },
  cast: [{ type: String }],
  rating: { type: Number, required: true },
  url: { type: String, required: true },
});

const Movie = mongoose.model<IMovie>('Movie', movieSchema);

export default Movie;

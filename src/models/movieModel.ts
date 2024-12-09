import mongoose, { Document, Schema } from 'mongoose';
import StreamingTypes from './streamingTypesModel';

interface IMovie extends Document {
  title: string;
  release_date: string;
  plot: string;
  cast: string[];
  rating: number;
  genre_ids: number[];
  url: string;
}

const movieSchema: Schema = new Schema({
  title: { type: String, required: true },
  release_date: { type: String },
  plot: { type: String, default: "" },
  cast: [{ type: String }],
  rating: { type: Number, required: true },
  genre_ids: { type: Array<Number>, required: true,
    validate: {
      validator: async function(categoriesIds: number[]) {
        const result = await Promise.all(categoriesIds.map(async (category_id: number) => {
          const streamingTypes = await StreamingTypes.find();
          const categories = streamingTypes.flatMap(type => type.categories);
          return categories.some((category: any) => category.id === category_id);
        }));
        return result.every(isValid => isValid === true);
      },
      message: (props: any) => `The genre(s) ${props.value} is/are not valid or not registered in the database!`
    }
   },
  url: { type: String, required: true },
});

const Movie = mongoose.model<IMovie>('Movie', movieSchema);

export default Movie;

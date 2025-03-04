import { Schema } from 'mongoose';

import Content from './contentModel';
import { IMovieDocument, IMovieModel } from '../interfaces/movie';

const movieSchema = new Schema({
  durationTime: { type: Number },
});

const Movie = Content.discriminator<IMovieDocument, IMovieModel>('movie', movieSchema);

export default Movie;

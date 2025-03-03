import mongoose, { Document, Schema, Model } from 'mongoose';
import { ErrorMessages } from '../../constants/errorMessages';
import { ISeriesResponse } from '../../interfaces/series/series';
import { StreamingServiceError } from '../../middleware/errorHandler';
import Genre from '../genresModel';

type ISerieSchema = Document & ISeriesResponse;

export interface ISeriesMethods {}

export interface ISeriesModel extends Model<ISerieSchema, {}, ISeriesMethods> {
  findByTitle(title: string, skip: number, limit: number): Promise<ISeriesResponse[] | null>;
  findByGenre(genreId: string, skip: number, limit: number): Promise<ISeriesResponse[] | null>;
}

const seriesSchema = new Schema<ISerieSchema, ISeriesModel, ISeriesMethods>(
  {
    title: {
      type: String,
      required: [true, ErrorMessages.SERIES_TITLE_REQUIRED],
      trim: true,
    },
    plot: {
      type: String,
      default: '',
    },
    release_date: {
      type: String,
    },
    cast: [{ type: String }],
    rating: {
      type: Number,
      required: [true, ErrorMessages.SERIES_RATING_INVALID],
      min: 0,
      max: 10,
    },
    genre: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      default: 'Released',
    },
    poster: {
      type: String,
    },
    url: {
      type: String,
    },
    tmdbId: {
      type: Number,
    },
    totalSeasons: {
      type: Number,
      default: 0,
    },
    totalEpisodes: {
      type: Number,
      default: 0,
    },
    seasonsSummary: [{
      seasonNumber: Number,
      title: String,
      episodeCount: Number,
      releaseDate: String,
    }]
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

seriesSchema.index({ title: 'text', plot: 'text' });
seriesSchema.index({ 'genre._id': 1 });
seriesSchema.index({ tmdbId: 1 });

async function validateGenres(genreRef: number[] | Array<{ id: number, name: string, _id: any }>) {  
  if (!genreRef || genreRef.length === 0) {
    return []; 
  }

  const uniqueGenreIds = [...new Set(genreRef.map(genre => 
    typeof genre === 'number' ? genre : genre.id
  ))];
  
  const existingGenres = await Genre.find({ id: { $in: uniqueGenreIds } });
  
  if (existingGenres.length !== uniqueGenreIds.length) {
    const existingIds = existingGenres.map(g => g.id);
    const invalidIds = uniqueGenreIds
      .filter(id => !existingIds.includes(id))
    
    throw new StreamingServiceError(`The following genre IDs do not exist: ${invalidIds.join(', ')}`, 400);
  }
  
  // Atualizar os nomes dos gêneros para garantir consistência
  return uniqueGenreIds.map(item => {
    const matchingGenre = existingGenres.find(g => g.id === item);
    if (! matchingGenre) {
      throw new StreamingServiceError("None of the provided genres are registered in our database", 400);
    }
    return {
      id: matchingGenre.id,
      name: matchingGenre.name,
      _id: matchingGenre._id,
    };
  });
}

seriesSchema.pre('validate', async function(next) {
  try {
    if (this.genre) {
      this.genre! = await validateGenres(this.genre);
    }
    next();
  } catch (error: any) {
    next(error);
  }
});


seriesSchema.pre('insertMany', async function(next, docs) {
  try {
    for (const doc of docs) {
      if (doc.genre) {
        doc.genre = await validateGenres(doc.genre);
      }
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

seriesSchema.static('findByTitle', function (title: string, skip: number, limit: number): Promise<ISeriesResponse[] | null> {
  return this.find({ title: new RegExp(title, 'i') })
    .skip(skip)
    .limit(limit);
});

seriesSchema.static('findByGenre', function (genreId: string, skip: number, limit: number): Promise<ISeriesResponse[] | null> {
  return this.find({ genreId }).skip(skip).limit(limit);
});

const Series = mongoose.model<ISerieSchema, ISeriesModel>('Series', seriesSchema);

export default Series;

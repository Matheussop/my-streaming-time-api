import mongoose, { Document, Schema, Model } from 'mongoose';
import StreamingTypes from '../streamingTypesModel';
import { ErrorMessages } from '../../constants/errorMessages';
import { ISeriesResponse } from '../../interfaces/series/series';
import { StreamingServiceError } from '../../middleware/errorHandler';

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
      required: [true, 'Title is required'],
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
      required: [true, 'Rating is required'],
      min: 0,
      max: 10,
    },
    genre: [{
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Genre',
        required: true
      },
      name: {
        type: String,
        required: true
      }
    }],
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

async function validateGenres(genreReferences: Array<{_id: any, name: string}>) {
  const Genre = mongoose.model('Genre');
  
  if (!genreReferences || genreReferences.length === 0) {
    return genreReferences;
  }
  
  const genreIds = genreReferences.map(g => g._id);
  const uniqueGenreIds = [...new Set(genreIds)];
  
  const existingGenres = await Genre.find({ _id: { $in: uniqueGenreIds } });
  
  if (existingGenres.length !== uniqueGenreIds.length) {
    const existingIds = existingGenres.map(g => g._id.toString());
    const invalidIds = uniqueGenreIds
      .filter(id => !existingIds.includes(id.toString()))
      .map(id => id.toString());
    
    throw new StreamingServiceError(`The following genre IDs do not exist: ${invalidIds.join(', ')}`, 400);
  }
  
  // Atualizar os nomes dos gêneros para garantir consistência
  return genreReferences.map(genreRef => {
    const matchingGenre = existingGenres.find(g => g._id.toString() === genreRef._id.toString());
    return {
      _id: genreRef._id,
      name: matchingGenre?.name || genreRef.name || ''
    };
  });
}

seriesSchema.pre('validate', async function (next) {
  seriesSchema.pre('validate', async function(next) {
    try {
      if (this.genre) {
        this.genre = await validateGenres(this.genre);
      }
      next();
    } catch (error: any) {
      next(error);
    }
  });
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

import mongoose, { Schema } from 'mongoose';
import Genre from './genresModel'
import { ErrorMessages } from '../constants/errorMessages';
import { StreamingServiceError } from '../middleware/errorHandler';
import { IContentResponse, IContentDocument, IContentModel } from '../interfaces/content';

const contentSchema = new Schema<IContentDocument, IContentModel>(
  {
    title: { type: String, required: [true, ErrorMessages.MOVIE_TITLE_REQUIRED] },
    releaseDate: { type: String, validate: {
      validator: function (value: string) {
        if (!value) return true; // Allow empty strings
        return /^\d{4}-\d{2}-\d{2}$/.test(value); // Check if it's in YYYY-MM-DD format
      },
      message: 'Release date must be in YYYY-MM-DD format'
    }  },
    plot: { type: String, default: '' },
    cast: [{ type: String }],
    rating: { type: Number },
    tmdbId: { type: Number },
    genre: { 
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (value: any) {
          if (!Array.isArray(value)) return false;
          if (value.length === 0) return true; // Allow empty arrays
          const isNumberArray = typeof value[0] === 'number';
          const isObjectArray = typeof value[0] === 'object' && value[0] !== null && 'id' in value[0] && 'name' in value[0];
          return isNumberArray || isObjectArray;
        },
        message: 'Genre must be an array of numbers or an array of objects with id and name properties',
      },
    },
    status: { type: String, default: 'Released' },
    poster: { type: String },
    url: { type: String},
    videoUrl: { type: String }
  },
  {
    timestamps: true,
    discriminatorKey: 'contentType',
    toJSON: {
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

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

contentSchema.pre('validate', async function(next) {
  try {
    if (this.genre) {
      this.genre! = await validateGenres(this.genre);
    }
    next();
  } catch (error: any) {
    next(error);
  }
});


contentSchema.pre('insertMany', async function(next, docs) {
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

contentSchema.static('findByTitle', function (title: string, skip: number, limit: number): Promise<IContentResponse[] | null> {
  return this.find({ title: new RegExp(title, 'i') })
    .skip(skip)
    .limit(limit);
});

contentSchema.static('findByGenre', function (genreName: string, skip: number, limit: number): Promise<IContentResponse[] | null> {
  return this.find({ genre: { $elemMatch: { name: genreName } } })
  .skip(skip).limit(limit);
});

contentSchema.index({ title: 'text', plot: 'text' });
contentSchema.index({ 'genre._id': 1 });
contentSchema.index({ tmdbId: 1 });
contentSchema.index({ title: 1, contentType: 1 }, { unique: true });

const Content = mongoose.model<IContentDocument, IContentModel>('Content', contentSchema);

export default Content;

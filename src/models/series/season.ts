import mongoose, { Document, Schema } from 'mongoose';
import { IEpisode, ISeasonDocument, ISeasonModel, ISeasonResponse, SeasonStatus } from '../../interfaces/series/season';
import { ErrorMessages } from '../../constants/errorMessages';
import Series from './seriesModel';

type IEpisodeSchema = Document & IEpisode;

const episodeSchema = new Schema<IEpisodeSchema>({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  episodeNumber: {
    type: Number,
    required: [true, 'Episode number is required'],
  },
  title: {
    type: String,
    required: [true, 'Episode title is required'],
    trim: true,
  },
  plot: {
    type: String,
    default: '',
  },
  durationInMinutes: {
    type: Number,
    required: [true, 'Duration is required'],
    min: 0,
  },
  releaseDate: {
    type: String,
  },
  poster: {
    type: String,
  },
});

const seasonSchema = new Schema<ISeasonDocument>(
  {
    seriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Series',
      required: [true, ErrorMessages.SERIE_ID_REQUIRED],
    },
    tmdbId: {
      type: Number,
      required: [true, ErrorMessages.TMDB_ID_REQUIRED],
    },
    seasonNumber: {
      type: Number,
      required: [true, ErrorMessages.SEASON_NUMBER_REQUIRED],
    },
    title: {
      type: String,
      required: [true, ErrorMessages.SEASON_TITLE_REQUIRED],
      trim: true,
    },
    plot: {
      type: String,
      default: '',
    },
    releaseDate: {
      type: String,
    },
    poster: {
      type: String,
    },
    episodes: [episodeSchema],
    episodeCount: {
      type: Number,
      default: 0,
    },
    // Novos campos para o sistema de cache inteligente
    status: {
      type: String,
      enum: ['COMPLETED', 'ONGOING', 'UPCOMING', 'SPECIAL_INTEREST'],
      default: 'UPCOMING',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    nextEpisodeDate: {
      type: Date,
    },
    releaseWeekday: {
      type: Number,
      min: 0,
      max: 6,
    },
    accessCount: {
      type: Number,
      default: 0,
    },
    lastAccessed: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

seasonSchema.index({ seriesId: 1, seasonNumber: 1 }, { unique: true });

seasonSchema.static('findBySeriesId', function(seriesId: string, skip: number, limit: number): Promise<ISeasonResponse[] | null> {
  return this.find({ seriesId }).skip(skip).limit(limit);
});

seasonSchema.static('findEpisodesBySeasonNumber', function(seriesId: string, seasonNumber: number): Promise<ISeasonResponse | null> {
  return this.findOne({ seriesId, seasonNumber }).sort({ episodeNumber: 1 });
});

seasonSchema.static('findByStatus', function(statuses: SeasonStatus[]): Promise<ISeasonResponse[]> {
  return this.find({ status: { $in: statuses } });
});

seasonSchema.static('findPopularSeasons', function(threshold: number = 50): Promise<ISeasonResponse[]> {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  return this.find({
    lastAccessed: { $gte: oneDayAgo },
    accessCount: { $gte: threshold }
  });
});

// Hook to update the season summary in the series when a season is saved
seasonSchema.post('save', async function() {
  
  await Series.findByIdAndUpdate(
    this.seriesId,
    {
      $set: {
        [`seasonsSummary.${this.seasonNumber - 1}`]: {
          seasonNumber: this.seasonNumber,
          title: this.title,
          episodeCount: this.episodes?.length || 0,
          releaseDate: this.releaseDate,
        }
      }
    }
  );
  
  // Recalculate number os seasons and episodes.
  const allSeasons = await mongoose.model('Season').find({ seriesId: this.seriesId });
  const totalEpisodes = allSeasons.reduce((sum, season) => sum + (season.episodes?.length || 0), 0);
  
  await Series.findByIdAndUpdate(
    this.seriesId,
    {
      $set: {
        totalSeasons: allSeasons.length,
        totalEpisodes: totalEpisodes,
      }
    }
  );
});

const Season = mongoose.model<ISeasonDocument, ISeasonModel>('Season', seasonSchema);

export default Season;
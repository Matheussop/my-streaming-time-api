import mongoose, { Document, Schema } from 'mongoose';
import { IEpisode, ISeasonDocument, ISeasonModel, ISeasonResponse } from '../../interfaces/series/season';
import { ErrorMessages } from '../../constants/errorMessages';

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

// Hook to update the season summary in the series when a season is saved
seasonSchema.post('save', async function() {
  const Series = mongoose.model('Series');
  
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
  const totalEpisodes = allSeasons.reduce((sum, season) => sum + season.episodes.length, 0);
  
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
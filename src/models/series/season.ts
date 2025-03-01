import mongoose, { Document, Model, Schema } from 'mongoose';
import { IEpisode, ISeasonResponse } from '../../interfaces/series/season';

type ISeasonSchema = Document & ISeasonResponse;
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

const seasonSchema = new Schema<ISeasonSchema>(
  {
    seriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Series',
      required: [true, 'Series ID is required'],
    },
    seasonNumber: {
      type: Number,
      required: [true, 'Season number is required'],
    },
    title: {
      type: String,
      required: [true, 'Season title is required'],
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
          episodeCount: this.episodes.length,
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

const Season = mongoose.model<ISeasonSchema>('Season', seasonSchema);

export default Season;
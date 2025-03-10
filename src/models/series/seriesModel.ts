import { Schema } from 'mongoose';
import Content from '../contentModel';
import { ISeriesDocument, ISeriesModel } from '../../interfaces/series/series';

const seriesSchema = new Schema({
  totalSeasons: {
    type: Number,
    default: 0,
  },
  totalEpisodes: {
    type: Number,
    default: 0,
  },
  seasonsSummary: [{
    seasonId: {
      type: Schema.Types.ObjectId,
      ref: 'Season',
    },
    seasonNumber: Number,
    title: String,
    episodeCount: Number,
    releaseDate: String,
  }]
});

const Series = Content.discriminator<ISeriesDocument, ISeriesModel>('series', seriesSchema);

export default Series;

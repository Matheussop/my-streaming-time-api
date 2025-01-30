import { Request, Response } from 'express';
import { SeriesService } from "../services/seriesService";
import { catchAsync } from "../util/catchAsync";
import { StreamingServiceError } from '../middleware/errorHandler';
import { MovieService } from '../services/movieService';
import logger from '../config/logger';
import { ErrorMessages } from '../constants/errorMessages';

export class CommonMediaController {
  constructor(private movieService: MovieService, private seriesService: SeriesService) {}

  getCommonMediaList = catchAsync(async (req: Request, res: Response) => {
    const { mediaType, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    let mediaList;
    if(mediaType === "movies") {
      mediaList = await this.movieService.getMovies(skip, Number(limit));
    }else if (mediaType === 'series'){
      mediaList = await this.seriesService.getSeries(skip, Number(limit));
    } else {
      throw new StreamingServiceError('Invalid type parameter. Use "movies" or "series".', 400)
    }

    res.status(200).json({
      page,
      limit,
      total: mediaList.length,
      media: mediaList,
    });
    
  });

  getMediaById = catchAsync(async (req: Request, res: Response) => {
    const { mediaType, id } = req.params;

    logger.info({
      message: 'Fetching movie by ID',
      movieId: req.params.id,
      method: req.method,
      path: req.path,
    });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new StreamingServiceError(ErrorMessages.COMMON_MEDIA_ID_INVALID, 400);
    }
    let media;
    if(mediaType === "movies") {
      media = await this.movieService.getMovieById(id);
    }else if (mediaType === 'series'){
      media = await this.seriesService.getSeriesById(id);
    } else {
      throw new StreamingServiceError('Invalid type parameter. Use "movies" or "series".', 400)
    }
    
    if(!media) {
      throw new StreamingServiceError(ErrorMessages.COMMON_MEDIA_NOT_FOUND, 404);
    }

    res.status(200).json(media);
  });
}

 
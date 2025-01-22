import { Request, Response } from 'express';
import { SeriesService } from "../services/seriesService";
import { catchAsync } from "../util/catchAsync";
import { StreamingServiceError } from '../middleware/errorHandler';
import { MovieService } from '../services/movieService';

export class CommonMediaController {
  constructor(private movieService: MovieService, private seriesService: SeriesService) {}

  getCommonMediaList = catchAsync(async (req: Request, res: Response) => {
    const { mediaType, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    console.log("Coasomda", mediaType, req.query)
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
}

 
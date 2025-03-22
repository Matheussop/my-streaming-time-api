import { Request, Response } from 'express';
import { catchAsync } from "../util/catchAsync";
import logger from '../config/logger';
import { ContentService } from '../services/commonService';

export class CommonMediaController {
  constructor(private contentService: ContentService) {}

  getCommonMediaList = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    logger.info({
      message: 'Getting common media list',
      page: page,
      limit: limit,
      skip: skip,
    })

    const mediaList = await this.contentService.getContentList(skip, Number(limit));
    res.status(200).json(mediaList);
  });

  getCommonMediaByGenre = catchAsync(async (req: Request, res: Response) => {
    const { genre } = req.body;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    logger.info({
      message: 'Getting common media by genre',
      genre: genre,
      page: page,
      limit: limit,
      skip: skip,
    })

    const mediaList = await this.contentService.getContentByGenre(genre, skip, Number(limit));
    res.status(200).json(mediaList);
  });
}

 
import { Request, Response } from 'express';
import logger from "../config/logger";
import { GenreService } from "../services/genreService";
import { catchAsync } from "../util/catchAsync";
import { StreamingServiceError } from '../middleware/errorHandler';
import { ErrorMessages } from '../constants/errorMessages';
import { createManyGenreSchema, genreItemSchema } from '../validators';

export class GenreController {
  constructor(private genreService: GenreService) {}

  getGenreByName = catchAsync(async (req: Request, res: Response) => {
    const { name } = req.params;
    logger.info({
      message: 'Fetching genre by name',
      name,
      method: req.method,
      path: req.path,
    });

    const genre = await this.genreService.getGenreByName(name);
    res.status(200).json(genre);
  });

  getGenreById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({
      message: 'Fetching genre by id',
      id,
      method: req.method,
      path: req.path,
    });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new StreamingServiceError(ErrorMessages.GENRE_INTERNAL_ID_INVALID, 400);
    }

    const genre = await this.genreService.getGenreById(id);
    res.status(200).json(genre);
  });
  
  getAllGenre = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 100 } = req.body;
    const skip = (Number(page) - 1) * Number(limit);

    logger.info({
      message: 'Fetching genre list',
      page,
      limit,
      skip,
      method: req.method,
      path: req.path,
    });

    if (Number(limit) > 100) {
      throw new StreamingServiceError(ErrorMessages.GENRE_FETCH_LIMIT_EXCEEDED, 400);
    }

    const genre = await this.genreService.getAllGenres(skip, limit);
    res.status(200).json(genre);
  });

  createGenre = catchAsync(async (req: Request, res: Response) => {
    const { id, name, poster } = req.body;
    logger.info({
      message: 'Create genres',
      id,
      method: req.method,
      path: req.path,
    });

    const data = { id, name, poster }
    const validatedData = genreItemSchema.parse(data);
    const genre = await this.genreService.createGenre(validatedData);
    res.status(201).json(genre);
  });

  createManyGenre = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Create many genres',
      method: req.method,
      path: req.path,
    })
    
    const validatedData = createManyGenreSchema.parse(req.body);

    const genresCreated = await this.genreService.createGenre(validatedData.genres);
    res.status(201).json({ message: "Genres created", genresCreated })
  });

  updateGenre = catchAsync(async (req: Request, res: Response) => {
    const { id, name, poster } = req.body;
    const { _id } = req.params;
    const data = { id, name, poster }
    logger.info({
      message: 'Update genre',
      _id,
      data,
      method: req.method,
      path: req.path,
    });
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new StreamingServiceError(ErrorMessages.GENRE_INTERNAL_ID_INVALID, 400);
    }
    
    const genre = await this.genreService.updateGenre(_id,data);
    res.status(200).json(genre);
  });

  deleteGenre = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({
      message: 'Delete genre by id',
      id,
      method: req.method,
      path: req.path,
    });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new StreamingServiceError(ErrorMessages.GENRE_INTERNAL_ID_INVALID, 400);
    }

    const genre = await this.genreService.deleteGenre(id);
    res.status(200).json({ message: "Genre Deleted", genre});
  });
}
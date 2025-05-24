import { Request, Response } from 'express';
import logger from "../config/logger";
import { GenreService } from "../services/genreService";
import { catchAsync } from "../util/catchAsync";
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
    const id = req.validatedIds.id;
    logger.info({
      message: 'Fetching genre by id',
      id,
      method: req.method,
      path: req.path,
    });

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
    const genre = await this.genreService.createGenre(data);
    res.status(201).json(genre);
  });

  createManyGenre = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Create many genres',
      method: req.method,
      path: req.path,
    })

    const genresCreated = await this.genreService.createGenre(req.body.genres);
    res.status(201).json({ message: "Genres created", genresCreated })
  });

  updateGenre = catchAsync(async (req: Request, res: Response) => {
    const { id, name, poster } = req.body;
    const _id = req.validatedIds._id;
    const data = { id, name, poster }
    logger.info({
      message: 'Update genre',
      id,
      data,
      method: req.method,
      path: req.path,
    });

    const genre = await this.genreService.updateGenre(_id,data);
    res.status(200).json(genre);
  });

  deleteGenre = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;
    logger.info({
      message: 'Delete genre by id',
      id,
      method: req.method,
      path: req.path,
    });

    const genre = await this.genreService.deleteGenre(id);
    res.status(200).json({ message: "Genre Deleted", genre});
  });
}
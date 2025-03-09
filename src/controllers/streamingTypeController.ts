import { Request, Response } from 'express';
import { catchAsync } from '../util/catchAsync';
import logger from '../config/logger';
import { StreamingServiceError } from '../middleware/errorHandler';
import { StreamingTypeService } from '../services/streamingTypeService';
import { Messages } from '../constants/messages';
import { ErrorMessages } from '../constants/errorMessages';

export class StreamingTypeController {
  constructor(private service: StreamingTypeService) {}

  getStreamingTypes = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    logger.info({
      message: 'Fetching streaming types',
      page,
      limit,
      method: req.method,
      path: req.path,
    });

    const streamingTypes = await this.service.getAllStreamingTypes(skip, Number(limit));
    res.status(200).json(streamingTypes);
  });

  getStreamingTypeById = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;

    logger.info({
      message: 'Fetching streaming type by ID',
      streamingTypeId: id,
      method: req.method,
      path: req.path,
    });

    const streamingType = await this.service.getStreamingTypeById(id);
    res.status(200).json(streamingType);
  });

  getStreamingTypeByName = catchAsync(async (req: Request, res: Response) => {
    const { name } = req.params;
    logger.info({
      message: 'Fetching streaming type by Category Name',
      streamingTypeCategoryName: name,
      method: req.method,
      path: req.path,
    });

    const streamingType = await this.service.getStreamingTypeByName(name);
    res.status(200).json(streamingType);
  });

  createStreamingType = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Creating new streaming type',
      data: { name: req.body.name, categoriesCount: req.body.categories?.length },
      method: req.method,
      path: req.path,
    });

    const streamingType = await this.service.createStreamingType(req.body);
    res.status(201).json(streamingType);
  });

  updateStreamingType = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;

    logger.info({
      message: 'Updating streaming type',
      streamingTypeId: id,
      data: req.body,
      method: req.method,
      path: req.path,
    });

    const streamingType = await this.service.updateStreamingType(id, req.body);
    res.json(streamingType);
  });

  addGenreToStreamingType = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;
    const { supportedGenres } = req.body;
    logger.info({
      message: 'Adding genre to streaming type',
      streamingTypeId: id,
      supportedGenres,
      method: req.method,
      path: req.path,
    });

    const streamingType = await this.service.addGenreToStreamingType(id, supportedGenres);
    res.json(streamingType);
  });

  deleteGenreFromStreamingTypeByName = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;
    const { genresName } = req.body;
    logger.info({
      message: 'Deleting genre from streaming type',
      streamingTypeId: id,
      genresName,
      method: req.method,
      path: req.path,
    });

    const streamingType = await this.service.deleteGenresFromStreamingTypeByName(id, genresName);
    res.json(streamingType);
  });

  deleteStreamingType = catchAsync(async (req: Request, res: Response) => {
    const id = req.validatedIds.id;
    
    logger.info({
      message: 'Deleting streaming type',
      streamingTypeId: id,
      method: req.method,
      path: req.path,
    });

    await this.service.deleteStreamingType(id);
    res.status(204).send(Messages.STREAMING_TYPE_DELETED_SUCCESSFULLY);
  });
}

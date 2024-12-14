import { Request, Response } from 'express';
import { StreamingTypeService } from '../services/streamingTypeService';
import { catchAsync } from '../util/catchAsync';
import logger from '../config/logger';
import { StreamingServiceError } from '../middleware/errorHandler';
import { IStreamingTypeRepository } from '../interfaces/repositories';

export class StreamingTypeController {
  private service: StreamingTypeService;

  constructor(private repository: IStreamingTypeRepository) {
    this.service = new StreamingTypeService(repository);
  }

  getStreamingTypes = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    logger.info({
      message: 'Fetching streaming types',
      page,
      limit,
      method: req.method,
      path: req.path
    });

    const streamingTypes = await this.service.getAllStreamingTypes(skip, Number(limit));
    res.status(200).json(streamingTypes);
  });

  getStreamingTypeById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({
      message: 'Fetching streaming type by ID',
      streamingTypeId: id,
      method: req.method,
      path: req.path
    });

    validateIdFormat(id, 'streamingType');

    const streamingType = await this.service.getStreamingTypeById(id);
    res.status(200).json(streamingType);
  });

  createStreamingType = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Creating new streaming type',
      data: { name: req.body.name, categoriesCount: req.body.categories?.length },
      method: req.method,
      path: req.path
    });

    const streamingType = await this.service.createStreamingType(req.body);
    res.status(201).json(streamingType);
  });

  addCategoryToStreamingType = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Adding category to streaming type',
      streamingTypeId: req.params.id,
      category: req.body,
      method: req.method,
      path: req.path
    });

    const { id } = req.params;
    const {categories} = req.body;


    const streamingType = await this.service.addCategoryToStreamingType(id, categories);
    res.status(200).json(streamingType);
  });

  removeCategoryFromStreamingType = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Removing category from streaming type',
      streamingTypeId: req.params.id,
      categoryId: req.params.categoryId,
      method: req.method,
      path: req.path
    });

    const { id } = req.params;
    const {categories} = req.body;

    const streamingType = await this.service.removeCategoryFromStreamingType(id, categories);
    res.status(200).json(streamingType);
  });

  updateStreamingType = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Updating streaming type',
      streamingTypeId: req.params.id,
      data: req.body,
      method: req.method,
      path: req.path
    });

    const streamingType = await this.service.updateStreamingType(req.params.id, req.body);
    res.json(streamingType);
  });

  deleteStreamingType = catchAsync(async (req: Request, res: Response) => {
    logger.info({
      message: 'Deleting streaming type',
      streamingTypeId: req.params.id,
      method: req.method,
      path: req.path
    });

    await this.service.deleteStreamingType(req.params.id);
    res.status(204).send();
  });
} 

const validateIdFormat = (id: string, type: string) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new StreamingServiceError(`Invalid ${type} ID format`, 400);
  }
}
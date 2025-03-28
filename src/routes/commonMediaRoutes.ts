import { Router } from 'express';
import { CommonMediaController } from '../controllers/commonMediaController';
import { ContentRepository } from '../repositories/contentRepository';
import { ContentService } from '../services/commonService';
import { validate } from '../middleware/validationMiddleware';
import { commonMediaByGenreParamSchema } from '../validators/commonMediaSchema';

const commonMediaRouter: Router = Router();
const contentRepository = new ContentRepository();
const contentService = new ContentService(contentRepository);

const commonMediaController = new CommonMediaController(contentService);

/**
 * @swagger
 * tags:
 *   name: Common Media
 *   description: Common Media management
 */

/**
 * @swagger
 * /commonMedia/{typeMedia}:
 *   get:
 *     summary: Retrieve a list of a common media
 *     tags: [Common Media]
 *     parameters:
 *       - in: path
 *         name: typeMedia
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A list of series
 */
commonMediaRouter.get('/', commonMediaController.getCommonMediaList);

/**
 * @swagger
 * /commonMedia/{genre}:
 *   get:
 *     summary: Retrieve a movie by genre
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: genre
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A movie object
 *       404:
 *         description: Movie not found
 */
commonMediaRouter.post(
  '/byGenre',
  validate(commonMediaByGenreParamSchema),
  commonMediaController.getCommonMediaByGenre,
);

export default commonMediaRouter;
import { Router } from 'express';
import { validateRequest } from '../util/validate';
import { SeriesController } from '../controllers/seriesController';
import { SeriesRepository } from '../repositories/seriesRepository';
import { SeriesService } from '../services/seriesService';

const seriesRouter: Router = Router();
const seriesRepository = new SeriesRepository();
const seriesService = new SeriesService(seriesRepository);
const seriesController = new SeriesController(seriesService);

/**
 * @swagger
 * tags:
 *   name: Series
 *   description: Series management
 */

/**
 * @swagger
 * /series/title:
 *   get:
 *     summary: Get series by title
 *     tags: [series]
 *     parameters:
 *       - in: query
 *         name: title
 *         type: string
 *         description: The title of the series
 *     responses:
 *       200:
 *         description: A list of series object
 *       404:
 *         description: series not found
 */
seriesRouter.get(
  '/title',
  (req, res, next) => validateRequest(req, res, next, ['title']),
  seriesController.getSeriesByTitle,
);

/**
 * @swagger
 * /series/external:
 *   get:
 *     summary: Retrieve a list of external list of series returned by TMDB
 *     tags: [series]
 *     responses:
 *       200:
 *         description: A list of series
 *       404:
 *         description: series not found
 */
seriesRouter.post(
  '/findOrAddSerie',
  (req, res, next) => validateRequest(req, res, next, ['title']),
  seriesController.findOrAddMovie,
);

export default seriesRouter;

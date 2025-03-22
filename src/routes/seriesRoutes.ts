import { Router } from 'express';
import { SeriesController } from '../controllers/seriesController';
import { SeriesRepository } from '../repositories/seriesRepository';
import { SeriesService } from '../services/seriesService';
import { seriesByGenreParamSchema, seriesByTitleParamSchema, seriesCreateSchema, updateSeriesSchema } from '../validators/seriesSchema';
import { validate } from '../middleware/validationMiddleware';
import { paginationSchema } from '../validators/common';
import { validateObjectId } from '../middleware/objectIdValidationMiddleware';
import { TMDBService } from '../services/tmdbService';
import { SeasonRepository } from '../repositories/seasonRepository';

const seriesRouter: Router = Router();
const seriesRepository = new SeriesRepository();
const tmdbService = new TMDBService();  
const seasonRepository = new SeasonRepository();
const seriesService = new SeriesService(seriesRepository, seasonRepository, tmdbService);
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
  validate(seriesByTitleParamSchema),
  seriesController.getSeriesByTitle,
);
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
seriesRouter.get('/', validate(paginationSchema, 'query'), seriesController.getSeries);

/**
 * @swagger
 * /series:
 *   get:
 *     summary: Retrieve a list of series
 *     tags: [Series]
 *     parameters:
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
seriesRouter.get('/:id', validateObjectId('params'), seriesController.getSerieById);

/**
 * @swagger
 * /series:
 *   post:
 *     summary: Create a new series
 *     tags: [Series]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               plot:
 *                 type: string
 *               cast:
 *                 type: array
 *                 items:
 *                   type: string
 *               rating:
 *                 type: number
 *               poster:
 *                 type: string
 *               url:
 *                 type: string
 *               releaseDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Serie created successfully
 */
seriesRouter.post(
  '/',
  validate(seriesCreateSchema),
  seriesController.createSeries,
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
  validate(seriesByTitleParamSchema),
  seriesController.findOrAddSerie,
);


/**
 * @swagger
 * /series/{id}:
 *   get:
 *     summary: Retrieve a serie by ID
 *     tags: [Series]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A movie object
 *       404:
 *         description: Series not found
 */
seriesRouter.get('/:id', validateObjectId('params'), seriesController.getSerieById);

/**
 * @swagger
 * /series/{genre}:
 *   get:
 *     summary: Retrieve a serie by genre
 *     tags: [Series]
 *     parameters:
 *       - in: path
 *         name: genre
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A serie object
 *       404:
 *         description: Serie not found
 */
seriesRouter.post(
  '/byGenre',
  validate(seriesByGenreParamSchema),
  seriesController.getSeriesByGenre,
);

/**
 * @swagger
 * /series/{id}:
 *   put:
 *     summary: Update a serie by ID
 *     tags: [Series]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               plot:
 *                 type: string
 *               cast:
 *                 type: array
 *                 items:
 *                   type: string
 *               rating:
 *                 type: number
 *               numberEpisode:
 *                 type: number
 *               numberSeasons:
 *                 type: number
 *               poster:
 *                 type: string
 *               url:
 *                 type: string
 *               release_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Serie updated successfully
 */
seriesRouter.put('/:id', 
  validateObjectId('params'), 
  validate(updateSeriesSchema), seriesController.updateSerie);


/**
 * @swagger
 * /series/{id}:
 *   delete:
 *     summary: Delete a serie by ID
 *     tags: [Series]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Serie deleted successfully
 */
seriesRouter.delete('/:id', validateObjectId('params'), seriesController.deleteSerie);

export default seriesRouter;

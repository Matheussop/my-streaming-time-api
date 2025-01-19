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
 *               release_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Serie created successfully
 */
seriesRouter.post(
  '/',
  (req, res, next) => validateRequest(req, res, next, ['title', 'cast', 'rating', 'url', 'poster', 'numberEpisodes', 'numberSeasons' , 'release_date', 'genre']),
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
  (req, res, next) => validateRequest(req, res, next, ['title']),
  seriesController.findOrAddSerie,
);

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
seriesRouter.delete('/:id', seriesController.deleteSerie);

export default seriesRouter;

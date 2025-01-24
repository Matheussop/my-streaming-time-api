import { StreamingTypeRepository } from './../repositories/streamingTypeRepository';
import { SeriesRepository } from './../repositories/seriesRepository';
import { Router } from 'express';
import { CommonMediaController } from '../controllers/commonMediaController';
import { SeriesService } from '../services/seriesService';
import { MovieRepository } from '../repositories/movieRepository';
import { MovieService } from '../services/movieService';

const commonMediaRouter: Router = Router();
const seriesRepository = new SeriesRepository();
const seriesService = new SeriesService(seriesRepository);
const movieRepository = new MovieRepository();
const streamingTypeRepository = new StreamingTypeRepository();
const movieService = new MovieService(movieRepository, streamingTypeRepository);
const commonMediaController = new CommonMediaController(movieService, seriesService);

/**
 * @swagger
 * tags:
 *   name: Common Media
 *   description: Common Media management
 */

/**
 * @swagger
 * /CommonList/{typeMedia}:
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

export default commonMediaRouter;
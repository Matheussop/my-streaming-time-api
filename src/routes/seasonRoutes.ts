import { Router } from 'express';
import { SeasonController } from '../controllers/seasonController';
import { SeasonService } from '../services/seasonService';
import { SeasonRepository } from '../repositories/seasonRepository';
import { validate } from '../middleware/validationMiddleware';
import { 
  episodesBySeasonNumberParamSchema,
  seasonCreateSchema, 
  seasonUpdateSchema, 
} from '../validators/seasonSchema';
import { validateObjectId } from '../middleware/objectIdValidationMiddleware';
import { paginationSchema } from '../validators/common';
import { TMDBService } from '../services/tmdbService';
const seasonRouter = Router();
const seasonRepository = new SeasonRepository();
const tmdbService = new TMDBService();
const seasonService = new SeasonService(seasonRepository, tmdbService);
const seasonController = new SeasonController(seasonService);

/**
 * @swagger
 * tags:
 *   name: Seasons
 *   description: Season management
 */

/**
 * @swagger
 * /seasons:
 *   get:
 *     summary: Get all seasons
 *     tags: [Seasons]
 *     responses:
 *       200:
 *         description: A list of seasons
 */
seasonRouter.get('/', validate(paginationSchema), seasonController.getSeasons);

/**
 * @swagger
 * /seasons/{id}:
 *   get:
 *     summary: Get a season by ID
 *     tags: [Seasons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A season
 */
seasonRouter.get('/:id', validateObjectId('params'), seasonController.getSeasonById);

/**
 * @swagger
 * /seasons:  
 *   post:
 *     summary: Create a season
 *     tags: [Seasons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seriesId:
 *                 type: string
 *                 description: The ID of the series
 *               seasonNumber:
 *                 type: number
 *                 description: The number of the season
 *               title:
 *                 type: string
 *                 description: The title of the season
 *               plot:
 *                 type: string
 *               releaseDate:
 *                 type: string
 *                 description: The release date of the season
 *               poster:
 *                 type: string
 *                 description: The poster of the season
 *     responses:
 *       201:
 *         description: A season
 */
seasonRouter.post('/', validate(seasonCreateSchema), seasonController.createSeason);

/**
 * @swagger
 * /seasons/{id}:
 *   put:
 *     summary: Update a season
 *     tags: [Seasons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seriesId:
 *                 type: string
 *                 description: The ID of the series
 *               seasonNumber:
 *                 type: number
 *                 description: The number of the season
 *               title:
 *                 type: string
 *                 description: The title of the season
 *               plot:
 *                 type: string
 *                 description: The plot of the season
 *               releaseDate:
 *                 type: string
 *                 description: The release date of the season
 *               poster:
 *                 type: string
 *                 description: The poster of the season
 *               episodes:
 *                  type: object of type IEpisode[]
 *                  description: The episodes of the season
 *     responses:
 *       200:
 *         description: A season
 */
seasonRouter.put('/:id', 
  validateObjectId('params'),
  validate(seasonUpdateSchema),
  seasonController.updateSeason
);

/**
 * @swagger
 * /seasons/series/{seriesId}:
 *   get:
 *     summary: Get seasons by series ID
 *     tags: [Seasons]
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of seasons by series ID
 */
seasonRouter.get('/series/:seriesId', 
  validate(paginationSchema),
  validateObjectId('params', 'seriesId'),
  seasonController.getSeasonsBySeriesId
);

// Get episodes by season number 
/**
 * @swagger
 * /seasons/episodes/{seriesId}/{seasonNumber}:
 *   get:
 *     summary: Get episodes by season number
 *     tags: [Seasons]
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: seasonNumber
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: A list of episodes by season number
 */
seasonRouter.get('/episodes/:seriesId/:seasonNumber', 
  validateObjectId('params', 'seriesId'),
  validate(episodesBySeasonNumberParamSchema, 'params'),
  seasonController.getEpisodesBySeasonNumber
);

/**
 * @swagger
 * /seasons/{id}:
 *   delete:
 *     summary: Delete a season
 *     tags: [Seasons]  
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string 
 *     responses:
 *       200:
 *         description: A season object
 */
seasonRouter.delete('/:id', validateObjectId('params'), seasonController.deleteSeason);

export default seasonRouter;


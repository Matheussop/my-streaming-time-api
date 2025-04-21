import { Router } from 'express';
import { StatisticsController } from '../controllers/statisticsController';
import { UserStreamingHistoryService } from '../services/userStreamingHistoryService';
import { StatisticsService } from '../services/statisticsService';
import { UserStreamingHistoryRepository } from '../repositories/userStreamingHistoryRepository';
import { MovieRepository } from '../repositories/movieRepository';
import { SeriesRepository } from '../repositories/seriesRepository';
import { ContentService } from '../services/commonService';
import { ContentRepository } from '../repositories/contentRepository';
import { validateObjectId } from '../middleware/objectIdValidationMiddleware';
const statisticsRouter: Router = Router();

const userStreamingHistoryRepository = new UserStreamingHistoryRepository();
const movieRepository = new MovieRepository();
const seriesRepository = new SeriesRepository();
const userStreamingHistoryService = new UserStreamingHistoryService(userStreamingHistoryRepository, movieRepository, seriesRepository);
const contentRepository = new ContentRepository();
const contentService = new ContentService(contentRepository);
const statisticsService = new StatisticsService(contentService);
const statisticsController = new StatisticsController(statisticsService, userStreamingHistoryService);

/**
 * @swagger
 * /statistics/{userId}:
 *   get:
 *     summary: Get all statistics for a user
 *     tags: [Statistics]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
statisticsRouter.get('/:id', validateObjectId(),
statisticsController.getAllStats);

/**
 * @swagger 
 * /statistics/{userId}/content-types:
 *   get:
 *     summary: Get content types distribution for a user
 *     tags: [Statistics]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Content types distribution retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */ 
statisticsRouter.get('/:userId/content-types', statisticsController.getContentTypeDistribution);

/**
 * @swagger
 * /statistics/{userId}/series-progress:
 *   get:
 *     summary: Get series progress stats for a user
 *     tags: [Statistics]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Series progress stats retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
statisticsRouter.get('/:userId/series-progress', statisticsController.getSeriesProgressStats);

/**
 * @swagger
 * /statistics/{userId}/watching-patterns:
 *   get:
 *     summary: Get watching patterns for a user
 *     tags: [Statistics]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Watching patterns retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
statisticsRouter.get('/:userId/watching-patterns', statisticsController.getWatchingPatterns);

/**
 * @swagger
 * /statistics/{userId}/genre-preferences:
 *   get:
 *     summary: Get genre preferences for a user
 *     tags: [Statistics]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Genre preferences retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
statisticsRouter.get('/:userId/genre-preferences', statisticsController.getGenrePreferences);

export default statisticsRouter; 
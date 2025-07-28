import { Router } from 'express';
import { UserStreamingHistoryController } from '../controllers/userStreamingHistoryController';
import { UserStreamingHistoryRepository } from '../repositories/userStreamingHistoryRepository';
import { MovieRepository } from '../repositories/movieRepository';
import { UserStreamingHistoryService } from '../services/userStreamingHistoryService';
import { SeriesRepository } from '../repositories/seriesRepository';
import { validateObjectId } from '../middleware/objectIdValidationMiddleware';
import { validate } from '../middleware/validationMiddleware';
import { paginationSchema } from '../validators';
import { 
  userStreamingHistoryAddEntrySchema,
  userStreamingHistoryRemoveEntrySchema,
  userStreamingHistoryGetByUserIdAndStreamingIdSchema,
  userStreamingHistoryAddEpisodeSchema,
  userStreamingHistoryRemoveEpisodeSchema,
  userStreamingHistoryMarkSeasonSchema,
} from '../validators/userStreamingHistorySchema';

const router: Router = Router();
const userStreamingHistoryRepository = new UserStreamingHistoryRepository();
const movieRepository = new MovieRepository();
const seriesRepository = new SeriesRepository();
const userStreamingHistoryService = new UserStreamingHistoryService(userStreamingHistoryRepository, movieRepository, seriesRepository);
const controller = new UserStreamingHistoryController(userStreamingHistoryService);

/**
 * @swagger
 * /streaming-history/get-episodes-watched:
 *   get:
 *     summary: Get episodes watched by user
 *     tags: [Streaming History]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Episodes watched by user
 *       404:
 *         description: User history not found
 *       500:
 *         description: Server error
 */
router.get('/get-episodes-watched', 
  validateObjectId('query', 'userId'),
  validateObjectId('query', 'contentId'),
  controller.getEpisodesWatched);

/**
 * @swagger
 * tags:
 *   name: Streaming History
 *   description: User streaming history management
 */

/**
 * @swagger
 * /streaming-history/{userId}:
 *   get:
 *     summary: Get user's streaming history
 *     tags: [Streaming History]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User streaming history object
 *       404:
 *         description: User history not found
 *       500:
 *         description: Server error
 */
router.get('/:userId', 
  validateObjectId('params', 'userId'),
  validate(paginationSchema),
  controller.getUserStreamingHistory);

/**
 * @swagger
 * /streaming-history:
 *   post:
 *     summary: Add streaming entry to user's history
 *     tags: [Streaming History]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - streamingId
 *               - title
 *               - durationInMinutes
 *             properties:
 *               userId:
 *                 type: string
 *               streamingId:
 *                 type: string
 *               title:
 *                 type: string
 *               durationInMinutes:
 *                 type: number
 *     responses:
 *       201:
 *         description: Streaming entry added successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  validate(userStreamingHistoryAddEntrySchema),
  controller.addStreamingToHistory,
);

/**
 * @swagger
 * /streaming-history/remove-entry:
 *   delete:
 *     summary: Remove streaming entry from user's history
 *     tags: [Streaming History]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - contentId
 *     responses:
 *       200:
 *         description: Streaming entry removed successfully
 *       404:
 *         description: Streaming entry not found or Failed to update history
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.delete(
  '/remove-entry',
  validate(userStreamingHistoryRemoveEntrySchema, 'query'),
  controller.removeStreamingFromHistory,
);

/**
 * @swagger
 * /streaming-history/remove-episode:
 *   delete:
 *     summary: Remove streaming episode from user's history
 *     tags: [Streaming History]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - contentId
 *               - episodeId
 *     responses:
 *       200:
 *         description: Streaming episode removed successfully
 *       404:
 *         description: Streaming episode not found or Failed to update history
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.delete(
  '/remove-episode',
  validate(userStreamingHistoryRemoveEpisodeSchema, 'query'),
  controller.removeEpisodeFromHistory,
);


/**
 * @swagger
 * /streaming-history:
 *   get:
 *     summary: Get user's streaming view by id
 *     tags: [Streaming History]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - streamingId
 *     responses:
 *       200:
 *         description: 
 *       404:
 *         description: Streaming entry not found or Failed to fetch streaming
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  validate(userStreamingHistoryGetByUserIdAndStreamingIdSchema, 'query'),
  controller.getByUserIdAndStreamingId,
);

/**
 * @swagger
 * /streaming-history/add-episode:
 *   post:
 *     summary: Add episode to user's history
 *     tags: [Streaming History]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - contentId
 *               - episodeData
 *     responses:
 *       201:
 *         description: Episode added to history successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post(
  '/add-episode',
  validate(userStreamingHistoryAddEpisodeSchema),
  controller.addEpisodeToHistory,
);

/**
 * @swagger
 * /streaming-history/mark-season-watched:
 *   post:
 *     summary: Mark all episodes from a season as watched
 *     tags: [Streaming History]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - contentId
 *               - seasonNumber
 *     responses:
 *       200:
 *         description: Season marked as watched
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */

router.post(
  '/mark-season-watched',
  validate(userStreamingHistoryMarkSeasonSchema),
  controller.markSeasonAsWatched,
);

/**
 * @swagger
 * /streaming-history/total-watch-time/{userId}:
 *   get:
 *     summary: Get user's total watch time
 *     tags: [Streaming History]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Total watch time value
 *       404:
 *         description: User history not found
 *       500:
 *         description: Server error
 */
router.get('/total-watch-time/:userId', 
  validateObjectId('params', 'userId'),
  controller.calculateTotalWatchTime);

export default router;

import { Router } from 'express';
import { UserStreamingHistoryController } from '../controllers/userStreamingHistoryController';
import { validateRequest } from '../util/validate';
import { UserStreamingHistoryRepository } from '../repositories/userStreamingHistoryRepository';
import { MovieRepository } from '../repositories/movieRepository';
import { UserStreamingHistoryService } from '../services/userStreamingHistoryService';

const router: Router = Router();
const userStreamingHistoryRepository = new UserStreamingHistoryRepository();
const movieRepository = new MovieRepository();
const userStreamingHistoryService = new UserStreamingHistoryService(userStreamingHistoryRepository, movieRepository);
const controller = new UserStreamingHistoryController(userStreamingHistoryService);

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
router.get('/:userId', controller.getUserStreamingHistory);

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
  (req, res, next) => validateRequest(req, res, next, ['userId', 'streamingId', 'title', 'durationInMinutes']),
  controller.addStreamingToHistory,
);

/**
 * @swagger
 * /streaming-history:
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
 *               - streamingId
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
router.put(
  '/',
  (req, res, next) => validateRequest(req, res, next, ['userId', 'streamingId']),
  controller.removeStreamingFromHistory,
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
  controller.getByUserIdAndStreamingId,
);

/**
 * @swagger
 * /streaming-history/{userId}/total-watch-time:
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
router.get('/:userId/total-watch-time', controller.calculateTotalWatchTime);

export default router;

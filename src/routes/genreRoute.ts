import { Router } from 'express';
import { GenreRepository } from '../repositories/genreRepository';
import { GenreService } from '../services/genreService';
import { GenreController } from '../controllers/genreController';
import { validate } from '../middleware/validationMiddleware';
import { paginationSchema } from '../validators/common';
import { validateObjectId } from '../middleware/objectIdValidationMiddleware';
import { createManyGenreSchema, genreByNameSchema, genreCreateSchema, genreUpdateSchema } from '../validators';
import { TMDBService } from '../services/tmdbService';

const router = Router();
const repository = new GenreRepository();
const tmdbService = new TMDBService();
const service = new GenreService(repository, tmdbService);
const controller = new GenreController(service);
/**
 * @swagger
 * tags:
 *   name: Genres
 *   description: Genres management
 */

/**
 * @swagger
 * /genre:
 *   get:
 *     summary: Retrieve a list of genres
 *     tags: [Genres]
 *     responses:
 *       200:
 *         description: A list of genres
 */
router.get('/', validate(paginationSchema), controller.getAllGenre);

/**
 * @swagger
 * /genre/sync:
 *   post:
 *     summary: Synchronize genres from TMDB
 *     tags: [Genres]
 *     responses:
 *       200:
 *         description: Genres synchronized successfully
 *       500:
 *         description: Error synchronizing genres
 */
router.post('/sync', controller.syncGenresFromTMDB);

/**
 * @swagger
 * /genre/{id}:
 *   get:
 *     summary: Retrieve a genre by ID
 *     tags: [Genres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A genre object
 *       404:
 *         description: Genre not found
 */
router.get('/:id', validateObjectId(), controller.getGenreById);

/**
 * @swagger
 * /genre/category/{category}:
 *   get:
 *     summary: Retrieve a genre by category name
 *     tags: [Genres]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A genre object
 *       404:
 *         description: Genre not found
 */
router.get('/byName/:name', validate(genreByNameSchema, 'params'), controller.getGenreByName);

/**
 * @swagger
 * /genre:
 *   post:
 *     summary: Create a new genre
 *     tags: [Genres]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               categories:
 *                 type: string
 *     responses:
 *       201:
 *         description: Genre created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', validate(genreCreateSchema, 'body'), controller.createGenre);

/**
 * @swagger
 * /genre/many:
 *   post:
 *     summary: Create two or more genres
 *     tags: [Genres]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               genres:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       required: true
 *                     id:
 *                       type: number
 *                       required: true
 *                     poster:
 *                       type: string
 *     responses:
 *       201:
 *         description: Genre created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/many', validate(createManyGenreSchema, 'body'), controller.createManyGenre);


/**
 * @swagger
 * /genre/{id}:
 *   put:
 *     summary: Update a genre by ID
 *     tags: [Genres]
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
 *               name:
 *                 type: string
 *               categories:
 *                 type: string
 *     responses:
 *       200:
 *         description: Genre updated successfully
 *       404:
 *         description: Genre not found
 */
router.put('/:_id', validateObjectId('params', '_id'), validate(genreUpdateSchema, 'body'), controller.updateGenre);

/**
 * @swagger
 * /genre/{id}:
 *   delete:
 *     summary: Delete a genre by ID
 *     tags: [Genres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Genre deleted successfully
 *       404:
 *         description: Genre not found
 */
router.delete('/:id', validateObjectId(), controller.deleteGenre);

export default router;

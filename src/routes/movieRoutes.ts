import { Router } from 'express';

import { StreamingTypeRepository } from './../repositories/streamingTypeRepository';
import { findOrAddMovie, fetchAndSaveExternalMovies, getExternalMovies } from '../controllers/movieTMDBController';
import { validateRequest } from '../util/validate';
import { MovieRepository } from '../repositories/movieRepository';
import { MovieController } from '../controllers/movieController';
import { MovieService } from '../services/movieService';

const movieRouter: Router = Router();
const movieRepository = new MovieRepository();
const streamingTypeRepository = new StreamingTypeRepository();
const movieService = new MovieService(movieRepository, streamingTypeRepository);
const movieController = new MovieController(movieService);

/**
 * @swagger
 * tags:
 *   name: Movies
 *   description: Movie management
 */

/**
 * @swagger
 * /movies/title:
 *   get:
 *     summary: Get movies by title
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: title
 *         type: string
 *         description: The title of the movie
 *     responses:
 *       200:
 *         description: A movie object
 *       404:
 *         description: Movie not found
 */
movieRouter.get(
  '/title',
  (req, res, next) => validateRequest(req, res, next, ['title']),
  movieController.getMoviesByTitle,
);

/**
 * @swagger
 * /movies:
 *   post:
 *     summary: Create a new movie
 *     tags: [Movies]
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
 *               url:
 *                 type: string
 *               release_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Movie created successfully
 */
movieRouter.post(
  '/',
  (req, res, next) => validateRequest(req, res, next, ['title', 'cast', 'rating', 'url', 'release_date']),
  movieController.createMovie,
);

/**
 * @swagger
 * /movies:
 *   get:
 *     summary: Retrieve a list of movies
 *     tags: [Movies]
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
 *         description: A list of movies
 */
movieRouter.get('/', movieController.getMovies);

/**
 * @swagger
 * /movies/external:
 *   get:
 *     summary: Retrieve a list of external list of movies returned by TMDB
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: A list of movies
 */
movieRouter.get('/external', getExternalMovies);

/**
 * @swagger
 * /movies/external:
 *   post:
 *     summary: Fetch and save external list of movies returned by TMDB
 *     tags: [Movies]
 *     responses:
 *       201:
 *         description: External movies fetched and saved successfully
 */
movieRouter.post('/saveExternalMovies', fetchAndSaveExternalMovies);

/**
 * @swagger
 * /movies/findOrAddMovie:
 *   post:
 *     summary: Find or add a movie
 *     tags: [Movies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               page:
 *                 type: number
 *               limit:
 *                 type: number
 *     responses:
 *       200:
 *         description: Movie found or added successfully
 *       400:
 *         description: Invalid input
 */
movieRouter.post('/findOrAddMovie', (req, res, next) => validateRequest(req, res, next, ['title']), findOrAddMovie);

/**
 * @swagger
 * /movies/{genre}:
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
movieRouter.post(
  '/byGenre',
  (req, res, next) => validateRequest(req, res, next, ['genre']),
  movieController.getMoviesByGenre,
);

/**
 * @swagger
 * /movies/{id}:
 *   get:
 *     summary: Retrieve a movie by ID
 *     tags: [Movies]
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
 *         description: Movie not found
 */
movieRouter.get('/:id', movieController.getMovieById);

/**
 * @swagger
 * /movies/{id}:
 *   put:
 *     summary: Update a movie by ID
 *     tags: [Movies]
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
 *               url:
 *                 type: string
 *               release_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Movie updated successfully
 */
movieRouter.put('/:id', movieController.updateMovie);

/**
 * @swagger
 * /movies/{id}:
 *   delete:
 *     summary: Delete a movie by ID
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Movie deleted successfully
 */
movieRouter.delete('/:id', movieController.deleteMovie);

export default movieRouter;

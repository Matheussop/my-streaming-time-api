import { Router } from 'express';

import { findOrAddMovie, fetchAndSaveExternalMovies, getExternalMovies } from '../controllers/movieTMDBController';
import { MovieRepository } from '../repositories/movieRepository';
import { MovieController } from '../controllers/movieController';
import { MovieService } from '../services/movieService';
import { TMDBService } from '../services/tmdbService';
import { validate } from '../middleware/validationMiddleware';
import { movieByGenreParamSchema, movieByTitleParamSchema, movieCreateSchema, movieUpdateFromTMDBSchema } from '../validators/movieSchema';
import { paginationSchema } from '../validators/common';
import { validateObjectId } from '../middleware/objectIdValidationMiddleware';

const movieRouter: Router = Router();
const movieRepository = new MovieRepository();
const tmdbService = new TMDBService();
const movieService = new MovieService(tmdbService, movieRepository);
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
  validate(movieByTitleParamSchema),
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
 *               poster:
 *                 type: string
 *               url:
 *                 type: string
 *               releaseDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Movie created successfully
 */
movieRouter.post(
  '/',
  validate(movieCreateSchema),
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
movieRouter.get('/', validate(paginationSchema, 'query'), movieController.getMovies);

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
movieRouter.get('/external', validate(paginationSchema), getExternalMovies);

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
movieRouter.post('/saveExternalMovies', validate(paginationSchema), fetchAndSaveExternalMovies);

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
movieRouter.post('/findOrAddMovie', validate(movieByTitleParamSchema), findOrAddMovie);

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
  validate(movieByGenreParamSchema),
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
movieRouter.get('/:id', validateObjectId('params'), movieController.getMovieById);

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
 *               poster:
 *                 type: string
 *               url:
 *                 type: string
 *               releaseDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Movie updated successfully
 */
movieRouter.put('/:id', validateObjectId('params'), movieController.updateMovie);

/**
 * @swagger
 * /movies/{id}/{tmdbId}:
 *   put:
 *     summary: Update a movie by ID from TMDB
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: tmdbId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Movie updated successfully
 */
movieRouter.put('/:id/:tmdbId', validate(movieUpdateFromTMDBSchema), movieController.updateMovieFromTMDB);

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
movieRouter.delete('/:id', validateObjectId('params'), movieController.deleteMovie);

export default movieRouter;

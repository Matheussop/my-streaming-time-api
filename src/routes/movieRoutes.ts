import { Router } from 'express';
import {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} from '../controllers/movieController';
import { findOrAddMovie, fetchAndSaveExternalMovies, getExternalMovies } from '../controllers/movieTMDBController';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Movies
 *   description: Movie management
 */

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
 *                 type: string
 *               rating:
 *                 type: string
 *               url:
 *                 type: string
 *               release_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Movie created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', createMovie);
/**
 * @swagger
 * /movies:
 *   get:
 *     summary: Retrieve a list of movies
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: A list of movies
 */
router.get('/', getMovies);

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
router.get('/external', getExternalMovies);

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
router.post('/external', fetchAndSaveExternalMovies);

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
router.post('/findOrAddMovie', findOrAddMovie);
/**
 * @swagger
 * /movies/{id}:
 *   get:
 *     summary: Retrieve a movie by ID
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: movie_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A movie object
 *       404:
 *         description: Movie not found
 */
router.get('/:id', getMovieById);

/**
 * @swagger
 * /movies/{id}:
 *   put:
 *     summary: Update a movie by ID
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: movie_id
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
 *                 type: string
 *               rating:
 *                 type: string
 *               url:
 *                 type: string
 *               release_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Movie updated successfully
 *       404:
 *         description: Movie not found
 */
router.put('/:id', updateMovie);

/**
 * @swagger
 * /movies/{movie_id}:
 *   delete:
 *     summary: Delete a movie by ID
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: movie_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Movie deleted successfully
 *       404:
 *         description: Movie not found
 */
router.delete('/:id', deleteMovie);

export default router;

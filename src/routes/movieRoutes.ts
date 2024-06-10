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

router.get('/', getMovies);
router.get('/external', getExternalMovies);
router.post('/external', fetchAndSaveExternalMovies);
router.get('/findOrAddMovie', findOrAddMovie);
router.get('/:id', getMovieById);
router.post('/', createMovie);
router.put('/:id', updateMovie);
router.delete('/:id', deleteMovie);

export default router;

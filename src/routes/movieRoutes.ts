import { Router } from 'express';
import {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} from '../controllers/movieController';
import { getExternalMovies } from '../controllers/movieTMDBController';

const router: Router = Router();

router.get('/', getMovies);
router.get('/external', getExternalMovies);
router.get('/:id', getMovieById);
router.post('/', createMovie);
router.put('/:id', updateMovie);
router.delete('/:id', deleteMovie);

export default router;

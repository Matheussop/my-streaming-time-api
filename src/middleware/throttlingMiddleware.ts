import { SeriesRepository } from './../repositories/seriesRepository';
import { Request, Response, NextFunction } from 'express';
import { SeriesService } from '../services/seriesService';
import { MovieRepository } from '../repositories/movieRepository';
import { MovieService } from '../services/movieService';
import { StreamingTypeRepository } from '../repositories/streamingTypeRepository';


let lastRequestTime = 0;
const requestInterval = 7 * 24 * 60 * 60 * 1000; // 7 days
let isFetching = false;

const fetchData = async () => {
  try {
    const streamingTypes = new StreamingTypeRepository();
    const seriesRepository = new SeriesRepository();
    const seriesService = new SeriesService(seriesRepository);
    await seriesService.fetchAndSaveExternalSeries();
    const moviesRepository = new MovieRepository();
    const movieService = new MovieService({} as any, moviesRepository, streamingTypes); // TODO: find a better way to use movieService without passing multiple repositories as parameters
    await movieService.fetchAndSaveExternalMovies();
    console.log('Data fetched and saved');
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

const throttlingMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const now = Date.now();
  if (now - lastRequestTime >= requestInterval) {
    isFetching = true;
    await fetchData();
    lastRequestTime = now;
    isFetching = false;
  }
  next();
};

export default throttlingMiddleware;
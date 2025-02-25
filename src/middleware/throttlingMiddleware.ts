import { SeriesRepository } from './../repositories/seriesRepository';
import { Request, Response, NextFunction } from 'express';
import { SeriesService } from '../services/seriesService';


let lastRequestTime = 0;
const requestInterval = 7 * 24 * 60 * 60 * 1000; // 7 days
let isFetching = false;

const fetchData = async () => {
  try {
    // await fetchAndSaveExternalMovies();
    const seriesRepository = new SeriesRepository();
    const seriesService = new SeriesService(seriesRepository);
    await seriesService.fetchAndSaveExternalSeries();
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
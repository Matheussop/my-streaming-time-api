import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import setupSwagger from './swagger';
import { errorHandler } from './middleware/errorHandler';
import { AuthMiddleware } from './middleware/authMiddleware';

import userStreamingHistoryRoutes from './routes/userStreamingHistoryRoutes';
import streamingTypeRoutes from './routes/streamingTypeRoutes';
import movieRoutes from './routes/movieRoutes';
import userRoutes from './routes/userRoutes';
import seriesRoutes from './routes/seriesRoutes';
import genreRoutes from './routes/genreRoute';
import commonMediaRoutes from './routes/commonMediaRoutes';
import seasonRoutes from './routes/seasonRoutes';
import throttlingMiddleware from './middleware/throttlingMiddleware';
import authRoutes from './routes/authRoutes';
import statisticsRoutes from './routes/statisticsRoutes';

// Import services for initialization
import { GenreService } from './services/genreService';
import { GenreRepository } from './repositories/genreRepository';
import { TMDBService } from './services/tmdbService';
import { StreamingTypeService } from './services/streamingTypeService';
import { StreamingTypeRepository } from './repositories/streamingTypeRepository';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const authMiddleware = new AuthMiddleware();

/**
 * Initialize application data
 * Syncs genres from TMDB and streamingTypes with genres on first startup
 */
const initializeApp = async () => {
  try {
    // Initialize services
    const tmdbService = new TMDBService();
    const genreRepository = new GenreRepository();
    const genreService = new GenreService(genreRepository, tmdbService);
    const streamingTypeRepository = new StreamingTypeRepository();
    const streamingTypeService = new StreamingTypeService(streamingTypeRepository, genreRepository);

    // Check if genres exist in database
    const existingGenres = await genreRepository.findAll(0, 1);
    
    if (existingGenres.length === 0) {
      console.log('No genres found in database. Starting TMDB genre synchronization...');
      const result = await genreService.syncGenresFromTMDB();
      console.log(`Genre synchronization completed. Movie genres: ${result.movieGenres}, TV genres: ${result.tvGenres}`);
    } else {
      console.log('Genres already exist in database. Skipping genre synchronization.');
    }

    // Check if streamingTypes exist and sync with genres
    const existingStreamingTypes = await streamingTypeRepository.findAll(0, 1);
    
    if (existingStreamingTypes.length === 0) {
      console.log('No streaming types found in database. Starting streaming types synchronization with genres...');
      const streamingResult = await streamingTypeService.syncStreamingTypesWithGenres();
      console.log(`Streaming types synchronization completed. Created: ${streamingResult.created}, Updated: ${streamingResult.updated}`);
    } else {
      console.log('Streaming types already exist in database. Skipping streaming types synchronization.');
    }
  } catch (error) {
    console.error('Error during application initialization:', error);
    // Don't exit the process, just log the error
  }
};

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to MongoDB');

    // Initialize application data
    await initializeApp();

    // Load lastRequestTime from the database
    const lastRequestTime = await throttlingMiddleware.getLastRequestTime();
    throttlingMiddleware.setLastRequestTime(lastRequestTime);

    // Global middlewares
    app.use(cors());
    app.use(express.json());
    app.use(throttlingMiddleware);

    // Global error middleware
    app.use(errorHandler);

    setupSwagger(app);

    // Public routes
    const publicRoutes = express.Router();
    publicRoutes.use('/auth', authRoutes);
    // Private routes
    const privateRoutes = express.Router();
    privateRoutes.use(authMiddleware.authenticate); // Authentication middleware for all private routes
    privateRoutes.use('/user', userRoutes); 
    privateRoutes.use('/commonMedia', commonMediaRoutes);
    privateRoutes.use('/movies', movieRoutes);
    privateRoutes.use('/series', seriesRoutes);
    privateRoutes.use('/seasons', seasonRoutes);
    privateRoutes.use('/genre', genreRoutes);
    privateRoutes.use('/streamingTypes', streamingTypeRoutes);
    privateRoutes.use('/user-streaming-history', userStreamingHistoryRoutes);
    privateRoutes.use('/statistics', statisticsRoutes);

    // Applying routes
    app.use('', publicRoutes);
    app.use('', privateRoutes);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
};

startServer();

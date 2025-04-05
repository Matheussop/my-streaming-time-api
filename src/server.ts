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
import { UserRepository } from './repositories/userRepository';
import { AuthService } from './services/authService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authMiddleware = new AuthMiddleware(authService);

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to MongoDB');

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

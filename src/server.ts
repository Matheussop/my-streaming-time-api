import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import setupSwagger from './swagger';
import { errorHandler } from './middleware/errorHandler';

import userStreamingHistoryRoutes from './routes/userStreamingHistoryRoutes';
import streamingTypeRoutes from './routes/streamingTypeRoutes';
import movieRoutes from './routes/movieRoutes';
import userRoutes from './routes/userRoutes';
import seriesRoutes from './routes/seriesRoutes';
import commonMediaRoutes from './routes/commonMediaRoutes';
import throttlingMiddleware from './middleware/throttlingMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to MongoDB');

    app.use(cors());
    app.use(express.json());

    setupSwagger(app);

    app.use(throttlingMiddleware);
    
    // Routes
    app.use('/commonMedia', commonMediaRoutes)
    app.use('/movies', movieRoutes);
    app.use('/series', seriesRoutes);
    app.use('/streamingTypes', streamingTypeRoutes);
    app.use('/user', userRoutes);
    app.use('/user-streaming-history', userStreamingHistoryRoutes);

    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
};

startServer();

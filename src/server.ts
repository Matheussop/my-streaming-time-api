import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import setupSwagger from './swagger';
import { errorHandler } from './middleware/errorHandler';

import userStreamingHistoryRoutes from "./routes/userStreamingHistoryRoutes";
import streamingTypesRoutes from "./routes/streamingTypesRoutes";
import movieRoutes from './routes/movieRoutes';
import userRoutes from './routes/userRoutes';
import { listUsers } from './controllers/userController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Primeiro conectar ao MongoDB
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to MongoDB');

    // Configuração dos middlewares
    app.use(cors());
    app.use(express.json());
    
    setupSwagger(app);

    // Routes
    app.use('/movies', movieRoutes);
    app.use('/streamingTypes', streamingTypesRoutes);
    app.use("/user", userRoutes); 
    /**
     * @swagger
     * /users:
     *   get:
     *     summary: Retrieve a list of users
     *     tags: [Users]
     *     responses:
     *       200:
     *         description: A list of users
     */
    app.use("/users", listUsers); 
    app.use("/user-streaming-history", userStreamingHistoryRoutes);

    app.use(errorHandler);

    // Iniciar o servidor apenas após a conexão com o banco
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
};

startServer();

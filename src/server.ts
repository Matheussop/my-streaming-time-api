import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import setupSwagger from './swagger';

import userStreamingHistoryRoutes from "./routes/userStreamingHistoryRoutes";
import streamingTypesRoutes from "./routes/streamingTypesRoutes";
import movieRoutes from './routes/movieRoutes';
import userRoutes from './routes/userRoutes';
import { listUsers } from './controllers/userController';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
 
setupSwagger(app);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI as string).then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Database connection error', err);
});

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

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import movieRoutes from './routes/movieRoutes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
 
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

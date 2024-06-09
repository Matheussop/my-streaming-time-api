import { Request, Response } from 'express';
import axios from 'axios';


export const getExternalMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const url = 'https://api.themoviedb.org/3/movie/popular?language=pt-BR&page=1';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_Bearer_Token}`
      }
    };
    const response = await axios.get(url, options);
    const myResponse = response.data.results.map((movie: any, index: number) => {
      return {
        id: movie.id,
        title: movie.title,
        year: movie.release_date,
        plot: movie.overview,
        rating: movie.vote_average,
        url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      }
    });
    res.status(200).json(myResponse.splice(0, 8));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
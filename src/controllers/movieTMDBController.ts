import { Request, Response } from 'express';
import axios from 'axios';
import Movie from '../models/movieModel';


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

// Método para fazer a requisição à API externa, modificar o objeto e salvar no banco de dados
export const fetchAndSaveExternalMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    // Faça a requisição à API externa
    const url = 'https://api.themoviedb.org/3/movie/popular?language=pt-BR&page=1';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_Bearer_Token}`
      }
    };
    const response = await axios.get(url, options);

    // Suponha que a resposta é uma lista de filmes
    const externalMovies = response.data.results;

    // Buscar todos os títulos dos filmes existentes no banco de dados
    const existingMovies = await Movie.find({}, 'title').lean();
    const existingTitles = existingMovies.map(movie => movie.title);

    // Filtrar e modificar os novos filmes
    const newMovies = externalMovies.filter((externalMovie: any) => !existingTitles.includes(externalMovie.title))
      .map((externalMovie: any) => ({
        title: externalMovie.title,
        release_date: externalMovie.release_date,
        plot: externalMovie.overview,
        rating: externalMovie.vote_average,
        url: `https://image.tmdb.org/t/p/w500${externalMovie.poster_path}`
      }));

    // Salvar os novos filmes no banco de dados
    const savedMovies = await Movie.insertMany(newMovies);

    res.status(201).json(savedMovies);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


// Novo método para verificar se um filme existe e adicioná-lo se não existir
export const findOrAddMovie = async (req: Request, res: Response): Promise<void> => {
  const title = req.body.title as string;

  if (!title) {
    res.status(400).json({ message: 'Title query parameter is required' });
    return;
  }

  try {
    // Verificar se o filme existe no banco de dados
    const existingMovie = await Movie.findOne({ title }).lean();
    if (existingMovie) {
      res.status(200).json(existingMovie);
      console.log("Ja Existia o filme no banco")
      return;
    }

    const encodedQueryParams = encodeURIComponent(title.trim());
    // Se não estiver no banco de dados, verificar na API externa
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodedQueryParams}&include_adult=false&language=pt-BR&page=1`;

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_Bearer_Token}`
      }
    };
    const response = await axios.get(url, options);

    if (response.data.results.length > 0) {
      const moviesToSave = response.data.results.map((externalMovie: any) => (
        {
          title: externalMovie.title,
          release_date: externalMovie.release_date,
          plot: externalMovie.overview,
          rating: externalMovie.vote_average,
          url: `https://image.tmdb.org/t/p/w500${externalMovie.poster_path}`
      }));
    

      // Salvar o novo filme no banco de dados
      const savedMovies = await Movie.insertMany(moviesToSave);

      console.log("Eram filmes novos, pesquisado e baixado no banco de dados")
      res.status(200).json(savedMovies);
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
import { IMovieRepository } from '../interfaces/repositories';
import Movie, { IMovie } from '../models/movieModel';

export class MovieRepository implements IMovieRepository {
  async findAll(skip: number, limit: number): Promise<IMovie[]> {
    return Movie.find().skip(skip).limit(limit);
  }

  async findById(id: string): Promise<IMovie | null> {
    return Movie.findById(id);
  }

  async create(data: any): Promise<IMovie> {
    const movie = new Movie(data);
    return movie.save();
  }

  async update(id: string, data: any): Promise<IMovie | null> {
    return Movie.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<IMovie | null> {
    return Movie.findByIdAndDelete(id);
  }

  async findByTitle(title: string, skip: number, limit: number): Promise<IMovie[] | null> {
    return Movie.findByTitle(title, skip, limit);
  }

  async findByGenre(genre_id: number, skip: number, limit: number): Promise<IMovie[] | null> {
    return Movie.findByGenre(genre_id, skip, limit);
  }
}

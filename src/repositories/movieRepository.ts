import { IMovieRepository } from '../interfaces/repositories';
import Movie, { IMovie } from '../models/movieModel';

export class MovieRepository implements IMovieRepository {
  async findAll(skip: number, limit: number) {
    return Movie.find().skip(skip).limit(limit);
  }

  async findById(id: string) {
    return Movie.findById(id);
  }

  async create(data: any): Promise<IMovie> {
    const movie = new Movie(data);
    return movie.save();
  }

  async update(id: string, data: any) {
    return Movie.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string) {
    return Movie.findByIdAndDelete(id);
  }

  async findByTitle(title: string, skip: number, limit: number): Promise<IMovie[] | null> {
    const regex = new RegExp(title, 'i');
    return Movie.find({ title: { $regex: regex } })
      .skip(skip)
      .limit(limit)
  }
} 
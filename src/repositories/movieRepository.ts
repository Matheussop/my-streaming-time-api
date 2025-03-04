import { IMovieResponse } from '../interfaces/movie';
import { IMovieRepository } from '../interfaces/repositories';
import Movie from '../models/movieModel';
import { IContentModel } from '../interfaces/content';

export class MovieRepository implements IMovieRepository {
  async findAll(skip: number, limit: number): Promise<IMovieResponse[]> {
    return Movie.find().sort({ releaseDate: -1 }).skip(skip).limit(limit) as unknown as IMovieResponse[];
  }

  async findById(id: string): Promise<IMovieResponse | null> {
    return Movie.findById(id) as unknown as IMovieResponse | null;
  }

  async create(data: any): Promise<IMovieResponse | IMovieResponse[]> {
    return Movie.create(data) as unknown as IMovieResponse | IMovieResponse[];
  }

  async createManyMovies(data: IMovieResponse[]){
    return Movie.insertMany(data) as unknown as IMovieResponse[];
  }

  async update(id: string, data: any): Promise<IMovieResponse | null> {
    return Movie.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }) as unknown as IMovieResponse | null;
  }

  async delete(id: string): Promise<IMovieResponse | null> {
    return Movie.findByIdAndDelete(id) as unknown as IMovieResponse | null;
  }

  async findByTitle(title: string, skip: number, limit: number): Promise<IMovieResponse[] | null> {
    return (Movie as unknown as IContentModel).findByTitle(title, skip, limit) as unknown as IMovieResponse[] | null;
  }

  async findByGenre(genre: string, skip: number, limit: number): Promise<IMovieResponse[] | null> {
    return (Movie as unknown as IContentModel).findByGenre(genre, skip, limit) as unknown as IMovieResponse[] | null;
  }
}

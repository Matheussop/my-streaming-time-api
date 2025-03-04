import { IContentResponse } from '../interfaces/content';
import { IContentRepository } from '../interfaces/repositories';
import Content from '../models/contentModel';

export class ContentRepository implements IContentRepository {
  async findAll(skip: number, limit: number): Promise<IContentResponse[]> {
    return Content.find().sort({ releaseDate: -1 }).skip(skip).limit(limit);
  }

  async findById(id: string): Promise<IContentResponse | null> {
    return Content.findById(id);
  }

  async create(data: any): Promise<IContentResponse> {
    const content = new Content(data);
    return content.save();
  }

  async createManyMovies(data: IContentResponse[]){
    return Content.insertMany(data);
  }

  async update(id: string, data: any): Promise<IContentResponse | null> {
    return Content.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<IContentResponse | null> {
    return Content.findByIdAndDelete(id);
  }
  
  async findByGenre(genre: string, skip: number, limit: number): Promise<IContentResponse[] | null> {
    return Content.findByGenre(genre, skip, limit);
  }

  async findByTitle(title: string, skip: number, limit: number): Promise<IContentResponse[] | null> {
    return Content.findByTitle(title, skip, limit);
  } 
}

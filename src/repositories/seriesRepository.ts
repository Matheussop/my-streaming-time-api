import { IContentModel } from "../interfaces/content";
import { ISeriesRepository } from "../interfaces/repositories";
import { ISeriesCreate, ISeriesResponse, ISeriesUpdate } from "../interfaces/series/series";
import Series from "../models/series/seriesModel";

export class SeriesRepository implements ISeriesRepository{
  async findAll(skip: number, limit: number): Promise<ISeriesResponse[]> {
    return Series.find().sort({ releaseDate: -1 }).skip(skip).limit(limit) as unknown as ISeriesResponse[];
  }

  async findById(id: string): Promise<ISeriesResponse | null> {
    return Series.findById(id) as unknown as ISeriesResponse | null;
  }

  async create(data: ISeriesCreate | ISeriesCreate[]): Promise<ISeriesResponse | ISeriesResponse[]> {
    return Series.create(data) as unknown as ISeriesResponse | ISeriesResponse[];
  }

  async update(id: string, data: ISeriesUpdate): Promise<ISeriesResponse | null> {
    return Series.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }) as unknown as ISeriesResponse | null;
  }

  async delete(id: string): Promise<ISeriesResponse | null> {
    return Series.findByIdAndDelete(id) as unknown as ISeriesResponse | null;
  }

  async findByTitle(title: string, skip: number, limit: number): Promise<ISeriesResponse[] | null> {
    return (Series as unknown as IContentModel).findByTitle(title, skip, limit) as unknown as ISeriesResponse[] | null;
  }

  async findByGenre(genre: string, skip: number, limit: number): Promise<ISeriesResponse[] | null> {
    return (Series as unknown as IContentModel).findByGenre(genre, skip, limit) as unknown as ISeriesResponse[] | null;
  }
}
import { ISeriesRepository } from "../interfaces/repositories";
import { ISeriesCreate, ISeriesResponse, ISeriesUpdate } from "../interfaces/series";
import Series from "../models/seriesModel";

export class SeriesRepository implements ISeriesRepository{
  async findAll(skip: number, limit: number): Promise<ISeriesResponse[]> {
    return Series.find().sort({ release_date: -1 }).skip(skip).limit(limit);
  }

  async findById(id: string): Promise<ISeriesResponse | null> {
    return Series.findById(id);
  }

  async create(data: any): Promise<ISeriesCreate> {
    const series = new Series(data);
    return series.save();
  }

  async update(id: string, data: any): Promise<ISeriesUpdate | null> {
    return Series.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<ISeriesResponse | null> {
    return Series.findByIdAndDelete(id);
  }

  async findByTitle(title: string, skip: number, limit: number): Promise<ISeriesResponse[] | null> {
    return Series.findByTitle(title, skip, limit);
  }

  async findByGenre(genre_id: number, skip: number, limit: number): Promise<ISeriesResponse[] | null> {
    return Series.findByGenre(genre_id, skip, limit)
  }

  async createManySeries(data: ISeriesCreate[]){
    return Series.create(data);
  }
}
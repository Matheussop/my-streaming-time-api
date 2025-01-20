export interface ISeriesCreate {
  title: string;
  release_date: string;
  plot: string;
  cast: string[];
  rating: number;
  numberEpisodes: number;
  numberSeasons: number;
  genre: number[] | IGenre[];
  poster: string;
  url: string;
}

export interface IGenre {
  id: number;
  name: string;
}

export interface ISeriesUpdate {
  title?: string;
  release_date?: string;
  plot?: string;
  cast?: string[];
  numberEpisodes?: number;
  numberSeasons?: number;
  rating?: number;
  genre?: number[] | IGenre[];
  poster?: string;
  url?: string;
}

export interface ISeriesResponse extends ISeriesCreate {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

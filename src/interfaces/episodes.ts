export interface IEpisodesCreate {
  title: string;
  release_date: string;
  plot: string;
  cast: string[];
  rating: number;
  duration: number;
  streamingId: string;
  poster: string;
  background: string;
}

export interface IEpisodesUpdate {
  title?: string;
  release_date?: string;
  plot?: string;
  cast?: string[];
  rating?: number;
  duration?: number;
  streamingId?: string;
  poster?: string;
  background?: string;
}

export interface IEpisodesResponse extends IEpisodesCreate {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

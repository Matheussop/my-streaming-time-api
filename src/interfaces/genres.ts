
export interface IGenreCreate {
  id: number;
  name: string;        
  poster: string; 
}

export interface IGenreUpdate {
  id?: number;
  name? : string;
  poster?: string;
}

export interface IGenreResponse extends IGenreCreate{
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

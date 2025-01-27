export interface ICategory {
  id: number;
  name: string;
  poster?: string;
}

export interface IStreamingTypeCreate {
  name: string;
  categories: ICategory[];
}

export interface IStreamingTypeUpdate {
  name?: string;
  categories?: ICategory[];
}

export interface IStreamingTypeResponse extends IStreamingTypeCreate {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

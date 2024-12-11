export interface IMovieRepository {
  findAll(skip: number, limit: number): Promise<any[]>;
  findById(id: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  findByTitle(title: string, skip: number, limit: number): Promise<any[]>;
}

export interface IUserRepository {
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any>;
  findByEmail(email: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
}

export interface IStreamingTypeRepository {
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
} 
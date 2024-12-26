import { IUser } from "../models/userModel";

export interface IUserService {
  registerUser(user: IUser): Promise<IUser>;
  loginUser(email: string, password: string): Promise<IUser>;
  getUserById(id: string): Promise<IUser | null>;
  updateUser(id: string, data: Partial<IUser>): Promise<IUser | null>;
  deleteUser(id: string): Promise< IUser | null>;
  getAllUsers(): Promise<IUser[]>;
}
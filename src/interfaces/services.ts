import { IUser } from "../models/userModel";
import { IUserStreamingHistory, StreamingHistoryEntry } from "../models/userStreamingHistoryModel";

export interface IUserService {
  registerUser(user: IUser): Promise<IUser>;
  loginUser(email: string, password: string): Promise<IUser>;
  getUserById(id: string): Promise<IUser | null>;
  updateUser(id: string, data: Partial<IUser>): Promise<IUser | null>;
  deleteUser(id: string): Promise< IUser | null>;
  getAllUsers(): Promise<IUser[]>;
}

export interface IUserStreamingHistoryService {
  getUserHistory(userId: string): Promise<IUserStreamingHistory>;
  addStreamingToHistory(userId: string, streamingData: StreamingHistoryEntry): Promise<IUserStreamingHistory>;
  removeStreamingFromHistory(userId: string, streamingId: string): Promise<IUserStreamingHistory | null>;
  getTotalWatchTime(userId: string): Promise<number>;
}
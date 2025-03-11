import { IUserRepository } from '../interfaces/repositories';
import { IUserCreate, IUserResponse, IUserUpdate } from '../interfaces/user';
import User from '../models/userModel';
import { Types } from 'mongoose';
export class UserRepository implements IUserRepository {
  async findAll(skip: number, limit: number): Promise<IUserResponse[]> {
    return User.find().skip(skip).limit(limit).select('-password');
  }

  async findById(id: string | Types.ObjectId): Promise<IUserResponse | null> {
    return User.findById(id).select('-password');
  }

  async findByEmail(email: string): Promise<IUserResponse | null> {
    return User.findOne({ email }).select('-password');
  }

  async findByEmailWithPassword(email: string): Promise<IUserResponse | null> {
    return User.findOne({ email }).select('+password');
  }

  async create(data: IUserCreate): Promise<IUserResponse> {
    return User.create(data);
  }

  async update(id: string | Types.ObjectId, data: Partial<IUserUpdate>): Promise<IUserResponse | null> {
    return User.findByIdAndUpdate(
      id,
      { $set: data }, // Using $set to update only the provided fields
      {
        new: true,
        runValidators: true,
      },
    );
  }
  
  async checkPassword(id: string | Types.ObjectId, password: string): Promise<boolean> {
    const user = await User.findById(id).select('+password');
    if (!user) {
      return false;
    }
    return user.correctPassword(password);
  }

  async delete(id: string | Types.ObjectId): Promise<IUserResponse | null> {
    return User.findByIdAndDelete(id);
  }
}

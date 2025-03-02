import { IUserRepository } from '../interfaces/repositories';
import { IUserCreate, IUserResponse, IUserUpdate } from '../interfaces/user';
import User from '../models/userModel';

export class UserRepository implements IUserRepository {
  async findAll(skip: number, limit: number): Promise<IUserResponse[]> {
    return User.find().skip(skip).limit(limit).select('-password');
  }

  async findById(id: string): Promise<IUserResponse | null> {
    return User.findById(id).select('-password');
  }

  async findByEmail(email: string): Promise<IUserResponse | null> {
    return User.findOne({ email }).select('-password');
  }

  async create(data: IUserCreate): Promise<IUserResponse> {
    const user = new User(data);
    return user.save();
  }

  async update(id: string, data: Partial<IUserUpdate>): Promise<IUserResponse | null> {
    return User.findByIdAndUpdate(
      id,
      { $set: data }, // Using $set to update only the provided fields
      {
        new: true,
        runValidators: true,
      },
    ).select('-password');
  }

  async delete(id: string): Promise<IUserResponse | null> {
    return User.findByIdAndDelete(id);
  }
}

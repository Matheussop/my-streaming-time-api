import { IUserRepository } from '../interfaces/repositories';
import User, { IUser } from '../models/userModel';

export class UserRepository implements IUserRepository {
  async findAll(skip = 0, limit = 10): Promise<IUser[]> {
    return User.find().skip(skip).limit(limit).select('-password');
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).select('-password');
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async create(data: any): Promise<IUser> {
    const user = new User(data);
    return user.save();
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      id,
      { $set: data }, // Using $set to update only the provided fields
      {
        new: true,
        runValidators: true,
      },
    ).select('-password');
  }

  async delete(id: string): Promise<IUser | null> {
    return User.findByIdAndDelete(id);
  }
}

import { IUserRepository } from '../interfaces/repositories';
import User from '../models/userModel';

export class UserRepository implements IUserRepository {
  async findAll() {
    return User.find();
  }

  async findById(id: string) {
    return User.findById(id);
  }

  async findByEmail(email: string) {
    return User.findOne({ email });
  }

  async create(data: any) {
    const user = new User(data);
    return user.save();
  }

  async update(id: string, data: any) {
    return User.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string) {
    return User.findByIdAndDelete(id);
  }
} 
import { InjectModel } from '@nestjs/mongoose';
import { Users } from '../schema/users';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(Users.name) private readonly userModel: Model<Users>,
  ) {}

  async findOne(query: any) {
    return await this.userModel.findOne(query);
  }

  async findById(id: string) {
    return await this.userModel.findById(id);
  }

  async find(query: any) {
    return await this.userModel.find(query);
  }

  async create(data: Record<string, any>) {
    return await this.userModel.create(data);
  }

  async findOneAndUpdate(query: any, data: Record<string, any>) {
    return await this.userModel.findOneAndUpdate(query, data, {
      runValidators: true,
      new: true,
    });
  }
}

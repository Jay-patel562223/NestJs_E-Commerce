import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Orders } from '../schema/orders';
import { Mode } from 'fs';
import { Model } from 'mongoose';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectModel(Orders.name) private readonly orderModel: Model<Orders>,
  ) {}

  async find(query: any) {
    return await this.orderModel.find(query);
  }

  async findOne(query: any) {
    return await this.orderModel.findOne(query);
  }

  async create(order: any) {
    return await this.orderModel.create(order);
  }

  async findOneAndUpdate(query: any, data: any) {
    return this.orderModel.findOneAndUpdate(query, data, { new: true });
  }
}

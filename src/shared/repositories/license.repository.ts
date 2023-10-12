import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { License } from '../schema/license';
import { Model } from 'mongoose';

@Injectable()
export class LicenseRepository {
  constructor(
    @InjectModel(License.name) private readonly licenseModel: Model<License>,
  ) {}

  async create(product: string, productSku: string, licenseKey: string) {
    return await this.licenseModel.create({
      product,
      productSku,
      licenseKey,
    });
  }

  async findById(id: string) {
    return await this.licenseModel.findById(id);
  }

  async findByIdAndDelete(id: string) {
    return await this.licenseModel.findByIdAndDelete(id);
  }

  async find(query: any) {
    return await this.licenseModel.find(query);
  }

  async findWithLimit(query: any, limit?: number) {
    return await this.licenseModel.find(query).limit(limit);
  }

  async findOneAndUpdate(query: any, update: any) {
    return await this.licenseModel.findOneAndUpdate(query, update, {
      runValidators: true,
      new: true,
    });
  }

  async findByIdAndUpdate(id: string, update: any) {
    return await this.licenseModel.findByIdAndUpdate(id, update, {
      runValidators: true,
      new: true,
    });
  }

  async updateMany(query: any, data: any) {
    return this.licenseModel.updateMany(query, data, { new: true });
  }
}

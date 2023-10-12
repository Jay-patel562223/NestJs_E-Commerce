import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Products } from '../schema/products';
import { Model } from 'mongoose';
import { CreateProductDto } from 'src/products/dto/create-product.dto';
import { ParsedOptions } from 'qs-to-mongo/lib/query/options-to-mongo';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectModel(Products.name) private readonly productModel: Model<Products>,
  ) {}

  async create(product: CreateProductDto) {
    return await this.productModel.create(product);
  }

  async findById(id: string) {
    return await this.productModel.findById(id);
  }

  async findOne(query: any) {
    return await this.productModel.findOne(query);
  }

  async findByIdAndUpdate(id: string, update: any) {
    return await this.productModel.findByIdAndUpdate(id, update, {
      runValidators: true,
      new: true,
    });
  }

  async findByIdAndDelete(id: string) {
    return await this.productModel.findByIdAndDelete(id);
  }

  async findProductWithGroupBy() {
    const products = await this.productModel.aggregate([
      {
        $facet: {
          latestProducts: [{ $sort: { createdAt: -1 } }, { $limit: 4 }],
          topRatedProducts: [{ $sort: { avgRating: -1 } }, { $limit: 8 }],
        },
      },
    ]);
    return products;
  }

  async find(query: Record<string, any>, options: ParsedOptions) {
    options.sort = options.sort || { _id: 1 };
    options.limit = options.limit || 12;
    options.skip = options.skip || 0;

    if (query.search) {
      query.productName = new RegExp(query.search + '.*', 'ig');
      delete query.search;
    }

    const products = await this.productModel.aggregate([
      {
        $match: query,
      },
      {
        $sort: options.sort,
      },
      { $skip: options.skip },
      { $limit: options.limit },
    ]);

    const totalProductCount = await this.productModel.countDocuments(query);
    return { totalProductCount, products };
  }

  async findRelatedProducts(query: Record<string, any>) {
    return await this.productModel.find(query).limit(4);
  }

  async findOneAndUpdate(query: Record<string, any>, update: any) {
    return await this.productModel.findOneAndUpdate(query, update, {
      new: true,
    });
  }
}

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { STRIPE_CLIENT } from 'src/stripe/constants';
import Stripe from 'stripe';
import { Products } from 'src/shared/schema/products';
import { GetProductQueryDto } from './dto/get-product-query.dto';
import qs2m from 'qs-to-mongo'

@Injectable()
export class ProductsService {
  constructor(
    @Inject(ProductRepository) private readonly productDB: ProductRepository,
    @Inject(STRIPE_CLIENT) private readonly stripeClient: Stripe,
  ) {}
  async create(createProductDto: CreateProductDto): Promise<{
    success: boolean;
    message: string;
    result: Products;
  }> {
    try {
      if (!createProductDto.stripeProductId) {
        const createdProductInStripe = await this.stripeClient.products.create({
          name: createProductDto.productName,
          description: createProductDto.description,
        });
        createProductDto.stripeProductId = createdProductInStripe.id;
      }

      const createProductInDB = await this.productDB.create(createProductDto);
      return {
        success: true,
        message: 'Product created successfully',
        result: createProductInDB,
      };
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error);
      }
      throw error;
    }
  }

  async findAll(query: GetProductQueryDto) {
    try {
      let callForHomePage = false;
      if (query.homepage) {
        callForHomePage = true;
      }
      delete query.homepage;
      const {criteria, options, links} = qs2m(query)
      if(callForHomePage){
        const products = await this.productDB.findProductWithGroupBy()
        return {
          message: products.length > 0 ? "Products fetched successfully" : "No products found",
          result: products,
          success: true
        }
      }
      const {totalProductCount, products} = await this.productDB.find(criteria, options)
        return {
          message: products.length > 0 ? "Products fetched successfully" : "No products found",
          result: {
            metadata: {
              skip: options.skip || 0,
              limit: options.limit || 12,
              total: totalProductCount,
              pages: options.limit ? Math.ceil(totalProductCount / options.limit) : 1,
              links: links("/", totalProductCount)
            },
            products
          },
          success: true
        }
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string): Promise<{
    success: boolean;
    message: string;
    result: Products;
  }> {
    try {
      const product = await this.productDB.findById(id);
      if (!product) {
        throw new Error('Product does not exist');
      }
      return {
        message: 'Product fetched successfully',
        result: product,
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<{
    success: boolean;
    message: string;
    result: Products;
  }> {
    try {
      const productExit = await this.productDB.findById(id);
      if (!productExit) {
        throw new Error('Product does not exist');
      }
      const updateProduct = await this.productDB.findByIdAndUpdate(
        id,
        updateProductDto,
      );
      if (!updateProductDto.stripeProductId) {
        await this.stripeClient.products.update(productExit.stripeProductId, {
          name: updateProductDto.productName,
          description: updateProductDto.description,
        });
      }
      return {
        success: true,
        message: 'Product updated successfully',
        result: updateProduct,
      };
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{
    message: string;
    success: boolean;
    result: null;
  }> {
    try {
      const productExit = await this.productDB.findById(id);
      if (!productExit) {
        throw new Error('Product does not exist');
      }
      await this.productDB.findByIdAndDelete(id);
      await this.stripeClient.products.del(productExit.stripeProductId);
      return {
        message: 'Product deleted successfully',
        success: true,
        result: null,
      };
    } catch (error) {
      throw error;
    }
  }
}

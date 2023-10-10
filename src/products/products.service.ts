import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { STRIPE_CLIENT } from 'src/stripe/constants';
import Stripe from 'stripe';
import { Products } from 'src/shared/schema/products';
import { GetProductQueryDto } from './dto/get-product-query.dto';
import qs2m from 'qs-to-mongo';
import cloudinary from 'cloudinary';
import { unlinkSync } from 'fs';
import { ProductSkuDto, ProductSkuDtoArr } from './dto/product-sku.dto';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(ProductRepository) private readonly productDB: ProductRepository,
    @Inject(STRIPE_CLIENT) private readonly stripeClient: Stripe,
  ) {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
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
      const { criteria, options, links } = qs2m(query);
      if (callForHomePage) {
        const products = await this.productDB.findProductWithGroupBy();
        return {
          message:
            products.length > 0
              ? 'Products fetched successfully'
              : 'No products found',
          result: products,
          success: true,
        };
      }
      const { totalProductCount, products } = await this.productDB.find(
        criteria,
        options,
      );
      return {
        message:
          products.length > 0
            ? 'Products fetched successfully'
            : 'No products found',
        result: {
          metadata: {
            skip: options.skip || 0,
            limit: options.limit || 12,
            total: totalProductCount,
            pages: options.limit
              ? Math.ceil(totalProductCount / options.limit)
              : 1,
            links: links('/', totalProductCount),
          },
          products,
        },
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string): Promise<{
    success: boolean;
    message: string;
    result: { product: Products; relatedProducts: Products[] };
  }> {
    try {
      const product: Products = await this.productDB.findById(id);
      if (!product) {
        throw new Error('Product does not exist');
      }

      const relatedProducts: Products[] =
        await this.productDB.findRelatedProducts({
          _id: { $ne: id },
          category: product.category,
        });

      return {
        message: 'Product fetched successfully',
        result: { product, relatedProducts },
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

  async uploadProductImage(
    id: string,
    file: any,
  ): Promise<{
    message: string;
    success: boolean;
    result: string;
  }> {
    try {
      const product = await this.productDB.findById(id);
      if (!product) {
        throw new Error('Product does not exist');
      }

      if (product.imageDetails?.public_id) {
        await cloudinary.v2.uploader.destroy(product.imageDetails.public_id, {
          invalidate: true,
        });
      }

      const resOfCloudinary = await cloudinary.v2.uploader.upload(file.path, {
        folder: process.env.CLOUDINARY_FOLDERPATH,
        public_id: `${process.env.CLOUDINARY_PUBLICID_PREFIX}${Date.now()}`,
        transformation: [
          {
            width: process.env.CLOUDINARY_BIGSIZE.toString().split('X')[0],
            height: process.env.CLOUDINARY_BIGSIZE.toString().split('X')[1],
            crop: 'fill',
          },
          { quality: 'auto' },
        ],
      });
      unlinkSync(file.path);
      await this.productDB.findByIdAndUpdate(id, {
        imageDetails: resOfCloudinary,
        image: resOfCloudinary.secure_url,
      });

      if (product?.stripeProductId) {
        await this.stripeClient.products.update(product.stripeProductId, {
          images: [resOfCloudinary.secure_url],
        });
      }

      return {
        message: 'Image uploaded successfully',
        success: true,
        result: resOfCloudinary.secure_url,
      };
    } catch (error) {
      throw error;
    }
  }

  // This is for Create one or multiple SKU details for product
  async createProductSku(
    productId: string,
    productSkuDto: ProductSkuDtoArr,
  ): Promise<{
    message: string;
    success: boolean;
    result: Products;
  }> {
    try {
      const product = await this.productDB.findById(productId);
      if (!product) {
        throw new Error('Product does not exist');
      }

      for (let data of productSkuDto.skuDetails) {
        const skuCode = Math.random().toString(36).substring(2, 5) + Date.now();
        data.skuCode = skuCode;
        if (!data.stripePriceId) {
          const stripePriceDetails = await this.stripeClient.prices.create({
            unit_amount: data.price * 100,
            currency: 'inr',
            product: product.stripeProductId,
            metadata: {
              skuCode: skuCode,
              lifetime: data.lifetime + '',
              productId: productId,
              price: data.price,
              productName: product.productName,
              productImage: product.image,
            },
          });
          data.stripePriceId = stripePriceDetails.id;
        }
      }

      const skuDetails = await this.productDB.findByIdAndUpdate(productId, {
        $push: { skuDetails: productSkuDto.skuDetails },
      });

      return {
        message: 'Product SKU updated successfully',
        success: true,
        result: skuDetails,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateProductSkuDetails(
    productId: string,
    skuId: string,
    updateProductSkuDto: ProductSkuDto,
  ): Promise<{
    message: string;
    success: boolean;
    result: Products;
  }> {
    try {
      const product = await this.productDB.findById(productId);
      if (!product) {
        throw new Error('Product does not exist');
      }

      const sku = product.skuDetails.find((sku) => sku._id == skuId);
      if (!sku) {
        throw new Error('SKU deos not exist');
      }

      if (updateProductSkuDto.price !== sku.price) {
        const stripePriceDetails = await this.stripeClient.prices.create({
          unit_amount: updateProductSkuDto.price * 100,
          currency: 'inr',
          product: product.stripeProductId,
          metadata: {
            skuCode: sku.skuCode,
            lifetime: updateProductSkuDto.lifetime + '',
            productId: productId,
            price: updateProductSkuDto.price,
            productName: product.productName,
            productImage: product.image,
          },
        });
        updateProductSkuDto.stripePriceId = stripePriceDetails.id;
        await this.stripeClient.prices.update(sku.stripePriceId, {
          active: false,
        });
      }

      const dataForUpdate = {}
      for (const key in updateProductSkuDto){
        if(updateProductSkuDto.hasOwnProperty(key)){
          dataForUpdate[`skuDetails.$.${key}`] = updateProductSkuDto[key]
        }
      }
      const updatedSkuDetails = await this.productDB.findOneAndUpdate(
        { _id: productId, 'skuDetails._id': skuId },
        {
          $set: dataForUpdate,
        },
      );

      return {
        message: 'Product SKU updated successfully',
        success: true,
        result: updatedSkuDetails,
      };
    } catch (error) {
      throw error;
    }
  }
}

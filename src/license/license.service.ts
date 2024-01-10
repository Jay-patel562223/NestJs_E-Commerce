import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { LicenseRepository } from 'src/shared/repositories/license.repository';
import { License } from 'src/shared/schema/license';

@Injectable()
export class LicenseService {
  constructor(
    @Inject(ProductRepository) private readonly productDB: ProductRepository,
    @Inject(LicenseRepository) private readonly licenseDB: LicenseRepository,
  ) {}
  async create(
    productId: string,
    skuId: string,
    licenseKey: string,
  ): Promise<{
    message: string;
    success: boolean;
    result: License;
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

      const license = await this.licenseDB.create(productId, skuId, licenseKey);

      return {
        message: 'License key added successfully',
        success: true,
        result: license,
      };
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error);
      }
      throw error;
    }
  }

  async findAll(
    productId: string,
    skuId: string,
  ): Promise<{
    message: string;
    success: boolean;
    result: License[];
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

      const result = await this.licenseDB.find({
        product: productId,
        productSku: skuId,
      });

      return {
        message: 'Licenses fetched successfully',
        success: true,
        result: result,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string): Promise<{
    message: string;
    success: boolean;
    result: License;
  }> {
    try {
      const license = await this.licenseDB.findById(id);
      return {
        message: 'License fetched successfully',
        success: true,
        result: license,
      };
    } catch (error) {
      throw error;
    }
  }

  async update(
    productId: string,
    skuId: string,
    id: string,
    licenseKey: string,
  ): Promise<{
    message: string;
    success: boolean;
    result: License;
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

      const updatedLicense = await this.licenseDB.findByIdAndUpdate(id, {
        licenseKey: licenseKey,
      });

      return {
        message: 'License key updated successfully',
        success: true,
        result: updatedLicense,
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
    result: License;
  }> {
    try {
      const result = await this.licenseDB.findByIdAndDelete(id);
      return {
        message: 'License Key removed successfully',
        success: true,
        result: result,
      };
    } catch (error) {
      throw error;
    }
  }
}

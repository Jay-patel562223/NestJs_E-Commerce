import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LicenseService } from './license.service';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { Roles } from 'src/shared/middleware/role.decorators';
import { userTypes } from 'src/shared/schema/users';

@Controller('license')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Post('/product/:productId/skus/:skuId')
  @Roles(userTypes.ADMIN)
  async create(
    @Param('productId') productId: string,
    @Param('skuId') skuId: string,
    @Body('licenseKey') licenseKey: string,
  ) {
    return await this.licenseService.create(productId, skuId, licenseKey);
  }

  @Get('/product/:productId/skus/:skuId')
  @Roles(userTypes.ADMIN)
  async findAll(
    @Param('productId') productId: string,
    @Param('skuId') skuId: string,
  ) {
    return await this.licenseService.findAll(productId, skuId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.licenseService.findOne(id);
  }

  @Patch(':id/product/:productId/skus/:skuId')
  async update(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Param('skuId') skuId: string,
    @Body('licenseKey') licenseKey: string,
  ) {
    return await this.licenseService.update(productId, skuId, id, licenseKey);
  }

  @Delete(':id')
  @Roles(userTypes.ADMIN)
  async remove(@Param('id') id: string) {
    return this.licenseService.remove(id);
  }
}

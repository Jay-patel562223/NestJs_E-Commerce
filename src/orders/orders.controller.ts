import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Req,
  Headers,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { checkoutDtoArr } from './dto/checkout.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('/checkout')
  async checkout(@Body() body: checkoutDtoArr, @Req() req: any) {
    return await this.ordersService.checkout(body, req.user);
  }

  @Post('/webhook')
  async webhook(
    @Body() rawBody: Buffer,
    @Headers('stripe-signature') sig: string,
  ) {
    return await this.ordersService.webhook(rawBody, sig);
  }

  @Get()
  async findAll(@Query('status') status: string, @Req() req: any) {
    return await this.ordersService.findAll(status, req.user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.ordersService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}

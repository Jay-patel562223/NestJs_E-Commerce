import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  } 

  @Get('order-success')
  orderSuccess() {
    return this.appService.orderSuccess()
  }

  @Get('order-cancel')
  orderCancel() {
    return this.appService.orderCancel()
  }

  @Get("/test")
  getTest(): string {
    return this.appService.getTest();
  }
  
}

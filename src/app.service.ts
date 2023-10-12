import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  orderSuccess(){
    return {
      suceess: true,
      message: 'Order Success',
      result: null
    }
  }

  orderCancel(){
    return {
      suceess: false,
      message: 'Order Cancel',
      result: null
    }
  }

  getTest(): any {
    return {
      message: "Test API",
      result: "Test 123",
      success: true
    }
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getTest(): any {
    return {
      message: "Test API",
      result: "Test 123",
      success: true
    }
  }
}

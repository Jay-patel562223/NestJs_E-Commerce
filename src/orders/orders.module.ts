import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { OrderRepository } from 'src/shared/repositories/order.repository';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/shared/middleware/roles.guard';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, Users } from 'src/shared/schema/users';
import { ProductSchema, Products } from 'src/shared/schema/products';
import { License, LicenseSchema } from 'src/shared/schema/license';
import { OrderSchema, Orders } from 'src/shared/schema/orders';
import { AuthMiddleware } from 'src/shared/middleware/auth';
import { LicenseRepository } from 'src/shared/repositories/license.repository';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    UserRepository,
    ProductRepository,
    LicenseRepository,
    OrderRepository,
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  imports: [
    MongooseModule.forFeature([
      {
        name: Users.name,
        schema: UserSchema,
      },
      {
        name: Products.name,
        schema: ProductSchema,
      },
      {
        name: License.name,
        schema: LicenseSchema,
      },
      {
        name: Orders.name,
        schema: OrderSchema,
      },
    ]),
  ],
})
export class OrdersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({
        path: '/orders/webhook',
        method: RequestMethod.POST,
      })
      .forRoutes(OrdersController);
  }
}

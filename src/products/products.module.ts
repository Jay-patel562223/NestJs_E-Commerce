import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductSchema, Products } from 'src/shared/schema/products';
import { UserSchema, Users } from 'src/shared/schema/users';
import { AuthMiddleware } from 'src/shared/middleware/auth';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/shared/middleware/roles.guard';
import { OrderSchema, Orders } from 'src/shared/schema/orders';
import { OrderRepository } from 'src/shared/repositories/order.repository';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductRepository,
    UserRepository,
    OrderRepository,
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  imports: [
    MongooseModule.forFeature([
      {
        name: Products.name,
        schema: ProductSchema,
      },
      {
        name: Users.name,
        schema: UserSchema,
      },
      {
        name: Orders.name,
        schema: OrderSchema,
      },
    ]),
  ],
})
export class ProductsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: '/products', method: RequestMethod.GET },
        { path: '/products/:id', method: RequestMethod.GET },
      )
      .forRoutes(ProductsController);
  }
}

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { License, LicenseSchema } from 'src/shared/schema/license';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/shared/middleware/roles.guard';
import { AuthMiddleware } from 'src/shared/middleware/auth';
import { ProductSchema, Products } from 'src/shared/schema/products';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { LicenseRepository } from 'src/shared/repositories/license.repository';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { UserSchema, Users } from 'src/shared/schema/users';

@Module({
  controllers: [LicenseController],
  providers: [
    LicenseService,
    UserRepository,
    LicenseRepository,
    ProductRepository,
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
    ]),
  ],
})
export class LicenseModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(LicenseController);
  }
}

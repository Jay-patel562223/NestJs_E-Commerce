import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformationInterceptor } from './responseInterceptor';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { raw } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use('/api/v1/orders/webhook', raw({ type: '*/*' }));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(cookieParser());
  app.setGlobalPrefix(process.env.APP_PREFIX);

  app.useGlobalInterceptors(new TransformationInterceptor());
  await app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformationInterceptor } from './responseInterceptor';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser())
  app.useGlobalInterceptors(new TransformationInterceptor())
  await app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
  });
}
bootstrap();

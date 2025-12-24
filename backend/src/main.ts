import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation with transformation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Enable automatic type transformation
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: false, // Don't throw error for extra properties
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos no permitidos
      forbidNonWhitelisted: true, // lanza error si hay campos extra
      transform: true, // transforma tipos
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

import 'reflect-metadata';
import dotenv from 'dotenv';

dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { createExpressApp } from './app.js';
import { connectDB } from './db/connection.js';
import { validateRuntimeEnv } from './utils/runtime-env.js';

async function bootstrap() {
  validateRuntimeEnv();
  await connectDB();

  const expressApp = createExpressApp();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { bodyParser: false },
  );

  app.enableShutdownHooks();

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    stopAtFirstError: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  console.log(`Servidor Nest escuchando en puerto ${port}`);
}

void bootstrap();
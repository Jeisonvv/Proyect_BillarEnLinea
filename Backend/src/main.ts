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

  // Log de configuración SMTP para depuración

  const { isMailConfigured } = await import('./services/mail.service.js');
  function logVar(name: string, value: unknown) {
    let length = 0;
    if (typeof value === 'string' || Array.isArray(value)) {
      length = value.length;
    }
    console.log(`${name}: [${value}] (length: ${length})`);
  }


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

  await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
  console.log(`Servidor escuchando en puerto ${process.env.PORT ?? 3000}`);
}

void bootstrap();
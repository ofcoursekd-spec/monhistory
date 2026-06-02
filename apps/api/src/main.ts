import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import type { IncomingMessage, ServerResponse } from 'http';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.use(helmet());

  // Préserve le raw body sur les routes webhook pour vérifier la signature HMAC
  app.use(
    bodyParser.json({
      verify: (req: IncomingMessage, _res: ServerResponse, buf: Buffer) => {
        (req as IncomingMessage & { rawBody?: string }).rawBody = buf.toString('utf8');
      },
    }),
  );
  app.enableCors({
    origin: config.get<string>('CORS_ORIGINS')?.split(',') ?? true,
    credentials: true,
  });

  app.setGlobalPrefix(config.get<string>('API_PREFIX') ?? 'api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MonHistory API')
    .setDescription('Backend de la plateforme MonHistory')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, doc);

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
}

bootstrap();

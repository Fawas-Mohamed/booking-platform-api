import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security
  app.use(helmet());
  app.enableCors();

  // Global request validation: strips unknown properties, rejects
  // extra fields, and auto-transforms payloads to their DTO types.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger / OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Booking Platform API')
    .setDescription(
      'Production-grade Booking Platform REST API built with NestJS, Prisma and PostgreSQL.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the JWT access token returned from /auth/login',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Registration and authentication')
    .addTag('Users', 'Authenticated user profile')
    .addTag('Services', 'Service management (authenticated)')
    .addTag('Bookings', 'Customer booking management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || configService.get<number>('port') || 3000;
  await app.listen(Number(port), '0.0.0.0');
  
  logger.log(`Application started on port ${port}`);
  logger.log(`Swagger available at: /api/docs`);
}

bootstrap();

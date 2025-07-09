/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for WebSocket connections
  app.enableCors({
    origin: '*', // Configure this properly for production
    methods: ['GET', 'POST'],
    credentials: true,
  });

  // Also setup as microservice for RabbitMQ communication
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://admin:admin@127.0.0.1:5672'],
      queue: 'realtime_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(8880); // HTTP server for health checks and stats

  Logger.log('🚀 Realtime Service is running on: http://localhost:8880');
  Logger.log('🔌 WebSocket server is running on: ws://localhost:8880/realtime');
  Logger.log('📡 RabbitMQ microservice is running on: realtime_queue');
}

bootstrap();

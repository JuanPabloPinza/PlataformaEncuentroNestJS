import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RealtimeGateway } from './gateways/realtime.gateway';
import { TicketLockService } from './services/ticket-lock.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'EVENTS_SERVICE_CLIENT',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 8879,
        },
      },
      {
        name: 'ORDERS_SERVICE_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin@127.0.0.1:5672'],
          queue: 'orders_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, RealtimeGateway, TicketLockService],
})
export class AppModule {}

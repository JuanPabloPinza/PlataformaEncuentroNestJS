// Ruta de archivo: PlataformaEncuentroNestJS/apps/api-gateway/src/app/app.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserController } from './user/user.controller';
import { EventsController } from './events/events.controller';
import { OrdersController } from './orders/orders.controller';
import { ORDER_SERVICE_RABBITMQ } from '../constants';
import { RpcExceptionInterceptor } from '../interceptors/rpc-exception.interceptor';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Configuración de los clientes de microservicios

    ClientsModule.register([
      {
        name: 'AUTH-SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 8877,
        },
      },
      {
        name: 'USER-SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 8878,
        },
      },
      {
        name: 'EVENTS-SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 8879,
        },
      },
      {
        name: ORDER_SERVICE_RABBITMQ,
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
  controllers: [AppController, AuthController, UserController, EventsController, OrdersController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RpcExceptionInterceptor,
    },
  ],
})
export class AppModule {}

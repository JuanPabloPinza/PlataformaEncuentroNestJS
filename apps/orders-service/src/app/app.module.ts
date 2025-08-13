import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Order } from './entities/order.entity';
import { OrderRepository } from './repositories/order.repository';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '127.0.0.1',
      port: 5432,
      username: 'postgres',
      password: 'alex',
      database: 'orders_db',
      entities: [Order],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Order]),
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
        name: 'REALTIME_SERVICE_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin@127.0.0.1:5672'],
          queue: 'realtime_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, OrderRepository],
})
export class AppModule {}

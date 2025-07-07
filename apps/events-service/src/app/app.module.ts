import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Event } from './entities/event.entity';
import { TicketCategory } from './entities/ticket-category.entity';
import { EventRepository } from './repositories/event.repository';
import { TicketCategoryRepository } from './repositories/ticket-category.repository';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres', // change as needed
      password: 'password', // change as needed
      database: 'events_db', 
      entities: [Event, TicketCategory],
      synchronize: true, // set to false in production
    }),
    TypeOrmModule.forFeature([Event, TicketCategory]),
  ],
  controllers: [AppController],
  providers: [AppService, EventRepository, TicketCategoryRepository],
})
export class AppModule {}

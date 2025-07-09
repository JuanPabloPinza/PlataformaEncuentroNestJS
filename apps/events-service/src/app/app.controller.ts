import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { CreateEventDto, UpdateEventDto, ReserveTicketsDto, UserContextDto } from './dto/event.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('create-event')
  async createEvent(@Payload() createEventDto: CreateEventDto) {
    return this.appService.createEvent(createEventDto);
  }

  @MessagePattern('get-all-events')
  async getAllEvents() {
    return this.appService.getAllEvents();
  }

  @MessagePattern('get-event-by-id')
  async getEventById(@Payload() id: number) {
    return this.appService.getEventById(id);
  }

  @MessagePattern('get-events-by-category')
  async getEventsByCategory(@Payload() category: string) {
    return this.appService.getEventsByCategory(category);
  }

  @MessagePattern('get-upcoming-events')
  async getUpcomingEvents() {
    return this.appService.getUpcomingEvents();
  }

  @MessagePattern('update-event')
  async updateEvent(@Payload() payload: { id: number; updateEventDto: UpdateEventDto }) {
    return this.appService.updateEvent(payload.id, payload.updateEventDto);
  }

  @MessagePattern('delete-event')
  async deleteEvent(@Payload() payload: { id: number; userContext: UserContextDto }) {
    return this.appService.deleteEvent(payload.id, payload.userContext);
  }

  @MessagePattern('get-ticket-categories')
  async getTicketCategories(@Payload() eventId: number) {
    return this.appService.getTicketCategories(eventId);
  }

  @MessagePattern('reserve-tickets')
  async reserveTickets(@Payload() reserveTicketsDto: ReserveTicketsDto) {
    return this.appService.reserveTickets(reserveTicketsDto);
  }

  @MessagePattern('release-tickets')
  async releaseTickets(@Payload() payload: { categoryId: number; quantity: number }) {
    return this.appService.releaseTickets(payload.categoryId, payload.quantity);
  }
}

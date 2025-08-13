// ruta de archivo: PlataformaEncuentroNestJS/apps/events-service/src/app/app.controller.ts
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
    console.log(`\n📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊`);
    console.log(`📊 [EVENTS SERVICE] GET-TICKET-CATEGORIES REQUEST RECEIVED!!!`);
    console.log(`📊 [EVENTS SERVICE] Event ID: ${eventId}`);
    console.log(`📊 [EVENTS SERVICE] Timestamp: ${new Date().toISOString()}`);
    console.log(`📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊\n`);
    
    try {
      const result = await this.appService.getTicketCategories(eventId);
      console.log(`📊 [EVENTS SERVICE] Returning ticket categories:`, result);
      return result;
    } catch (error) {
      console.error(`❌ [EVENTS SERVICE] Error getting ticket categories:`, error);
      throw error;
    }
  }

  @MessagePattern('reserve-tickets')
  async reserveTickets(@Payload() reserveTicketsDto: ReserveTicketsDto) {
    console.log(`🎫 [EVENTS SERVICE] RECEIVED RESERVE-TICKETS REQUEST!`);
    console.log(`🎫 [EVENTS SERVICE] Request data:`, JSON.stringify(reserveTicketsDto, null, 2));
    console.log(`🎫 [EVENTS SERVICE] Timestamp:`, new Date().toISOString());
    
    try {
      const result = await this.appService.reserveTickets(reserveTicketsDto);
      console.log(`🎫 [EVENTS SERVICE] Reserve tickets result:`, result);
      return result;
    } catch (error) {
      console.error(`❌ [EVENTS SERVICE] Reserve tickets error:`, error);
      throw error;
    }
  }

  @MessagePattern('release-tickets')
  async releaseTickets(@Payload() payload: { categoryId: number; quantity: number }) {
    return this.appService.releaseTickets(payload.categoryId, payload.quantity);
  }
}

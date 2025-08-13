// Ruta de archivo: PlataformaEncuentroNestJS/apps/api-gateway/src/app/events/events.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Inject, 
  UseGuards, 
  ParseIntPipe,
  Request 
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthGuard } from '../../guards/auth/auth.guard';
import { CreateEventDto, UpdateEventDto, ReserveTicketsDto, ReleaseTicketsDto } from './dto/events.dto';

@Controller('events')
export class EventsController {
  constructor(
    @Inject('EVENTS-SERVICE') private readonly eventsClient: ClientProxy,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async createEvent(@Body() createEventDto: CreateEventDto, @Request() req: any) {
    const userContext = {
      userId: req.user.userId,
      role: req.user.role
    };
    
    return await firstValueFrom(
      this.eventsClient.send('create-event', {
        ...createEventDto,
        userContext
      })
    );
  }

  @Get()
  async getAllEvents() {
    return await firstValueFrom(
      this.eventsClient.send('get-all-events', {})
    );
  }

  @Get('upcoming')
  async getUpcomingEvents() {
    return await firstValueFrom(
      this.eventsClient.send('get-upcoming-events', {})
    );
  }

  @Get('category/:category')
  async getEventsByCategory(@Param('category') category: string) {
    return await firstValueFrom(
      this.eventsClient.send('get-events-by-category', category)
    );
  }

  @Get(':id')
  async getEventById(@Param('id', ParseIntPipe) id: number) {
    return await firstValueFrom(
      this.eventsClient.send('get-event-by-id', id)
    );
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req: any
  ) {
    const userContext = {
      userId: req.user.userId,
      role: req.user.role
    };
    
    return await firstValueFrom(
      this.eventsClient.send('update-event', { 
        id, 
        updateEventDto: {
          ...updateEventDto,
          userContext
        }
      })
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteEvent(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userContext = {
      userId: req.user.userId,
      role: req.user.role
    };
    
    return await firstValueFrom(
      this.eventsClient.send('delete-event', { id, userContext })
    );
  }

  @Get(':id/tickets')
  async getTicketCategories(@Param('id', ParseIntPipe) eventId: number) {
    return await firstValueFrom(
      this.eventsClient.send('get-ticket-categories', eventId)
    );
  }

  @Post('tickets/reserve')
  @UseGuards(AuthGuard)
  async reserveTickets(@Body() reserveTicketsDto: ReserveTicketsDto) {
    return await firstValueFrom(
      this.eventsClient.send('reserve-tickets', reserveTicketsDto)
    );
  }

  @Post('tickets/release')
  @UseGuards(AuthGuard)
  async releaseTickets(@Body() payload: ReleaseTicketsDto) {
    return await firstValueFrom(
      this.eventsClient.send('release-tickets', payload)
    );
  }
}

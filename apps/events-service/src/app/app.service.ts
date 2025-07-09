import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventRepository } from './repositories/event.repository';
import { TicketCategoryRepository } from './repositories/ticket-category.repository';
import { CreateEventDto, UpdateEventDto, ReserveTicketsDto, UserContextDto } from './dto/event.dto';
import { Event } from './entities/event.entity';
import { TicketCategory } from './entities/ticket-category.entity';
import { Role } from './enums/role.enum';

@Injectable()
export class AppService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly ticketCategoryRepository: TicketCategoryRepository,
  ) {}

  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    console.log('🎭 [Events Service] Creating event with user context:', createEventDto.userContext);
    
    // Check if user has ORGANIZER role
    if (createEventDto.userContext.role !== Role.ORGANIZER) {
      console.log('❌ [Events Service] Access denied: User is not an organizer');
      throw new ForbiddenException('Only organizers can create events');
    }

    console.log('✅ [Events Service] User authorized to create event');
    
    const { userContext, ...eventData } = createEventDto;
    const event = await this.eventRepository.create({
      ...eventData,
      createdBy: userContext.userId, // Set the creator
    });

    console.log('🎉 [Events Service] Event created successfully by user:', userContext.userId);
    return event;
  }

  async getAllEvents(): Promise<Event[]> {
    return this.eventRepository.findAll();
  }

  async getEventById(id: number): Promise<Event> {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async getEventsByCategory(category: string): Promise<Event[]> {
    return this.eventRepository.findByCategory(category);
  }

  async getUpcomingEvents(): Promise<Event[]> {
    return this.eventRepository.findUpcomingEvents();
  }

  async updateEvent(id: number, updateEventDto: UpdateEventDto): Promise<Event> {
    console.log('✏️ [Events Service] Updating event:', id, 'by user:', updateEventDto.userContext.userId);
    
    // First check if event exists
    const existingEvent = await this.eventRepository.findById(id);
    if (!existingEvent) {
      console.log('❌ [Events Service] Event not found:', id);
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Check if user is the creator of the event
    if (existingEvent.createdBy !== updateEventDto.userContext.userId) {
      console.log('❌ [Events Service] Access denied: User', updateEventDto.userContext.userId, 'is not the creator of event', id);
      throw new ForbiddenException('You can only edit events that you created');
    }

    console.log('✅ [Events Service] User authorized to update event');
    
    const { userContext, ...updateData } = updateEventDto;
    const event = await this.eventRepository.update(id, updateData);
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    
    console.log('🎉 [Events Service] Event updated successfully');
    return event;
  }

  async deleteEvent(id: number, userContext: UserContextDto): Promise<boolean> {
    console.log('🗑️ [Events Service] Deleting event:', id, 'by user:', userContext.userId);
    
    // First check if event exists
    const existingEvent = await this.eventRepository.findById(id);
    if (!existingEvent) {
      console.log('❌ [Events Service] Event not found:', id);
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Check if user is the creator of the event
    if (existingEvent.createdBy !== userContext.userId) {
      console.log('❌ [Events Service] Access denied: User', userContext.userId, 'is not the creator of event', id);
      throw new ForbiddenException('You can only delete events that you created');
    }

    console.log('✅ [Events Service] User authorized to delete event');
    
    const result = await this.eventRepository.delete(id);
    if (!result) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    
    console.log('🎉 [Events Service] Event deleted successfully');
    return result;
  }

  async getTicketCategories(eventId: number): Promise<TicketCategory[]> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    const categories = await this.ticketCategoryRepository.findByEventId(eventId);
    
    // Ensure availableSeats is computed and serialized
    return categories.map(category => ({
      ...category,
      availableSeats: category.totalSeats - category.reservedSeats
    }));
  }

  async reserveTickets(reserveTicketsDto: ReserveTicketsDto): Promise<boolean> {
    const { eventId, categoryId, quantity } = reserveTicketsDto;
    console.log('🎫 [Events Service] Reserving tickets:', { eventId, categoryId, quantity });

    // Validate event exists
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      console.log('❌ [Events Service] Event not found:', eventId);
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Validate category exists and belongs to event
    const category = await this.ticketCategoryRepository.findById(categoryId);
    if (!category || category.eventId !== eventId) {
      console.log('❌ [Events Service] Category not found:', { categoryId, eventId });
      throw new NotFoundException(`Ticket category with ID ${categoryId} not found for this event`);
    }

    console.log('📊 [Events Service] Category details:', {
      id: category.id,
      name: category.categoryName,
      totalSeats: category.totalSeats,
      reservedSeats: category.reservedSeats,
      availableSeats: category.totalSeats - category.reservedSeats
    });

    // Check if enough seats are available
    const availableSeats = category.totalSeats - category.reservedSeats;
    if (availableSeats < quantity) {
      console.log('❌ [Events Service] Not enough seats:', { available: availableSeats, requested: quantity });
      throw new BadRequestException(`Not enough seats available. Only ${availableSeats} seats left`);
    }

    // Reserve the tickets
    console.log('🔒 [Events Service] Attempting to reserve tickets...');
    const success = await this.ticketCategoryRepository.reserveTickets(categoryId, quantity);
    if (!success) {
      console.log('❌ [Events Service] Failed to reserve tickets');
      throw new BadRequestException('Failed to reserve tickets');
    }

    console.log('✅ [Events Service] Tickets reserved successfully');
    return true;
  }

  async releaseTickets(categoryId: number, quantity: number): Promise<boolean> {
    const category = await this.ticketCategoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Ticket category with ID ${categoryId} not found`);
    }

    return this.ticketCategoryRepository.releaseTickets(categoryId, quantity);
  }
}

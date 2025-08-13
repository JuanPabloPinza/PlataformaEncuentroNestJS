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
  
  const { userContext, ticketCategories, ...updateData } = updateEventDto;
  
  // Debug: Log what's being sent to repository
  console.log('🔍 [Events Service] Update data being sent to repository:', updateData);
  console.log('🔍 [Events Service] Ticket categories extracted:', ticketCategories);
  
  // Update event basic data (excluding ticketCategories)
  const event = await this.eventRepository.update(id, updateData);
  if (!event) {
    throw new NotFoundException(`Event with ID ${id} not found`);
  }
  
  // Update ticket categories if provided
  if (ticketCategories && ticketCategories.length > 0) {
    console.log('🎫 [Events Service] Updating ticket categories');
    console.log('🔍 [Events Service] Existing event has categories:', existingEvent.ticketCategories?.length || 0);
    console.log('🔍 [Events Service] New categories to process:', ticketCategories.length);
    
    for (let i = 0; i < ticketCategories.length; i++) {
      const categoryData = ticketCategories[i];
      const existingCategory = existingEvent.ticketCategories?.[i];
      
      console.log('🔍 [Events Service] Category data:', categoryData);
      console.log('🔍 [Events Service] Existing category full object:', existingCategory);
      
      // Try both possible ID field names
      const categoryId = existingCategory?.idTicketCategory || existingCategory?.id;
      
      if (existingCategory && categoryId && categoryData) {
        // UPDATE existing category
        console.log('📝 [Events Service] Updating existing category at index:', i);
        
        // Filter out undefined/null values to avoid empty criteria error
        const cleanCategoryData = Object.fromEntries(
          Object.entries(categoryData).filter(([, value]) => value !== undefined && value !== null && value !== '')
        );
        
        if (Object.keys(cleanCategoryData).length > 0) {
          await this.ticketCategoryRepository.update(categoryId, cleanCategoryData);
          console.log('✏️ [Events Service] Updated ticket category:', categoryId);
        } else {
          console.log('⚠️ [Events Service] Skipping empty category update for:', categoryId);
        }
      } else if (categoryData && categoryData.categoryName && categoryData.price !== undefined && categoryData.totalSeats !== undefined) {
        // CREATE new category (only if required fields are present)
        console.log('➕ [Events Service] Creating new category at index:', i);
        
        const newCategoryData = {
          categoryName: categoryData.categoryName,
          price: categoryData.price,
          totalSeats: categoryData.totalSeats,
          description: categoryData.description,
          eventId: id, // Link to the event
          isActive: true,
          reservedSeats: 0 // Initialize reserved seats
        };
        
        console.log('🔍 [Events Service] New category data:', newCategoryData);
        
        const newCategory = await this.ticketCategoryRepository.create(newCategoryData);
        console.log('✅ [Events Service] Created new ticket category:', newCategory.id);
      } else {
        console.log('⚠️ [Events Service] Skipping category - missing required data at index:', i);
        console.log('  - categoryName:', categoryData?.categoryName);
        console.log('  - price:', categoryData?.price);
        console.log('  - totalSeats:', categoryData?.totalSeats);
      }
    }
  }
  
  console.log('🎉 [Events Service] Event updated successfully');
  return this.eventRepository.findById(id);
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

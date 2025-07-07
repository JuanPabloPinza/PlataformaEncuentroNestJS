import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventRepository } from './repositories/event.repository';
import { TicketCategoryRepository } from './repositories/ticket-category.repository';
import { CreateEventDto, UpdateEventDto, ReserveTicketsDto } from './dto/event.dto';
import { Event } from './entities/event.entity';
import { TicketCategory } from './entities/ticket-category.entity';

@Injectable()
export class AppService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly ticketCategoryRepository: TicketCategoryRepository,
  ) {}

  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    const event = await this.eventRepository.create({
      eventName: createEventDto.eventName,
      eventCategory: createEventDto.eventCategory,
      description: createEventDto.description,
      eventDate: createEventDto.eventDate,
      location: createEventDto.location,
      ticketCategories: createEventDto.ticketCategories,
    });

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
    const event = await this.eventRepository.update(id, updateEventDto);
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await this.eventRepository.delete(id);
    if (!result) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return result;
  }

  async getTicketCategories(eventId: number): Promise<TicketCategory[]> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    return this.ticketCategoryRepository.findByEventId(eventId);
  }

  async reserveTickets(reserveTicketsDto: ReserveTicketsDto): Promise<boolean> {
    const { eventId, categoryId, quantity } = reserveTicketsDto;

    // Validate event exists
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Validate category exists and belongs to event
    const category = await this.ticketCategoryRepository.findById(categoryId);
    if (!category || category.eventId !== eventId) {
      throw new NotFoundException(`Ticket category with ID ${categoryId} not found for this event`);
    }

    // Check if enough seats are available
    if (category.availableSeats < quantity) {
      throw new BadRequestException(`Not enough seats available. Only ${category.availableSeats} seats left`);
    }

    // Reserve the tickets
    const success = await this.ticketCategoryRepository.reserveTickets(categoryId, quantity);
    if (!success) {
      throw new BadRequestException('Failed to reserve tickets');
    }

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

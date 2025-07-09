import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';
import { CreateEventDto, UpdateEventDto } from '../dto/event.dto';

@Injectable()
export class EventRepository {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async create(eventData: Omit<CreateEventDto, 'userContext'> & { createdBy: number }): Promise<Event> {
    const event = this.eventRepository.create(eventData);
    return this.eventRepository.save(event);
  }

  async findAll(): Promise<Event[]> {
    return this.eventRepository.find({
      relations: ['ticketCategories'],
      where: { isActive: true },
    });
  }

  async findById(id: number): Promise<Event | null> {
    return this.eventRepository.findOne({
      where: { idEvent: id },
      relations: ['ticketCategories'],
    });
  }

  async findByCategory(category: string): Promise<Event[]> {
    return this.eventRepository.find({
      where: { eventCategory: category, isActive: true },
      relations: ['ticketCategories'],
    });
  }

  async update(id: number, updateEventDto: Omit<UpdateEventDto, 'userContext'>): Promise<Event | null> {
    await this.eventRepository.update(id, updateEventDto);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.eventRepository.update(id, { isActive: false });
    return result.affected > 0;
  }

  async findUpcomingEvents(): Promise<Event[]> {
    return this.eventRepository.find({
      where: { 
        isActive: true,
      },
      relations: ['ticketCategories'],
      order: { eventDate: 'ASC' },
    });
  }
}

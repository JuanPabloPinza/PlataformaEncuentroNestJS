import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketCategory } from '../entities/ticket-category.entity';
import { CreateTicketCategoryDto, UpdateTicketCategoryDto } from '../dto/event.dto';

@Injectable()
export class TicketCategoryRepository {
  constructor(
    @InjectRepository(TicketCategory)
    private readonly ticketCategoryRepository: Repository<TicketCategory>,
  ) {}

  async create(createTicketCategoryDto: CreateTicketCategoryDto & { eventId: number }): Promise<TicketCategory> {
    const ticketCategory = this.ticketCategoryRepository.create(createTicketCategoryDto);
    return this.ticketCategoryRepository.save(ticketCategory);
  }

  async findByEventId(eventId: number): Promise<TicketCategory[]> {
    return this.ticketCategoryRepository.find({
      where: { eventId, isActive: true },
    });
  }

  async findById(id: number): Promise<TicketCategory | null> {
    return this.ticketCategoryRepository.findOne({
      where: { id },
      relations: ['event'],
    });
  }

  async update(id: number, updateTicketCategoryDto: UpdateTicketCategoryDto): Promise<TicketCategory | null> {
    await this.ticketCategoryRepository.update(id, updateTicketCategoryDto);
    return this.findById(id);
  }

  async reserveTickets(categoryId: number, quantity: number): Promise<boolean> {
    const category = await this.findById(categoryId);
    if (!category) {
      return false;
    }

    if (category.availableSeats < quantity) {
      return false; // Not enough seats available
    }

    await this.ticketCategoryRepository.update(categoryId, {
      reservedSeats: category.reservedSeats + quantity,
    });

    return true;
  }

  async releaseTickets(categoryId: number, quantity: number): Promise<boolean> {
    const category = await this.findById(categoryId);
    if (!category) {
      return false;
    }

    const newReservedSeats = Math.max(0, category.reservedSeats - quantity);
    await this.ticketCategoryRepository.update(categoryId, {
      reservedSeats: newReservedSeats,
    });

    return true;
  }
}

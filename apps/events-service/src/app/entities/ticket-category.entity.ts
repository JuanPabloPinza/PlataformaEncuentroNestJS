import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from './event.entity';

@Entity()
export class TicketCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  categoryName: string; // e.g., 'Platinum', 'Gold', 'Silver', etc.

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  totalSeats: number;

  @Column({ type: 'int', default: 0 })
  reservedSeats: number;

  // Calculated field for available seats
  get availableSeats(): number {
    return this.totalSeats - this.reservedSeats;
  }

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Event, (event) => event.ticketCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ name: 'event_id' })
  eventId: number;
}

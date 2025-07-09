import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  idEvent: number;

  @Column({ length: 255 })
  eventName: string;

  @Column({ length: 100 })
  eventCategory: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp' })
  eventDate: Date;

  @Column({ length: 255, nullable: true })
  location: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ name: 'created_by' })
  createdBy: number; // User ID who created this event

  @OneToMany('TicketCategory', 'event', { cascade: true })
  ticketCategories: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

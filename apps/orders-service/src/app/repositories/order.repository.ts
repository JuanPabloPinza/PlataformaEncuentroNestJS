import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dto/order.dto';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(orderData: Partial<Order>): Promise<Order> {
    const order = this.orderRepository.create(orderData);
    return this.orderRepository.save(order);
  }

  async findById(id: number): Promise<Order | null> {
    return this.orderRepository.findOne({ where: { id } });
  }

  async findByUserId(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async findByEventId(eventId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { eventId },
      order: { createdAt: 'DESC' }
    });
  }

  async updateStatus(id: number, status: OrderStatus, notes?: string): Promise<Order | null> {
    await this.orderRepository.update(id, { status, notes });
    return this.findById(id);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    return this.orderRepository.find({
      where: { status },
      order: { createdAt: 'DESC' }
    });
  }
}

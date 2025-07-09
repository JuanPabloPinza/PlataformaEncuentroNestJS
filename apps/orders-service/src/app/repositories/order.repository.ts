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

  async findById(id: string | number): Promise<Order | null> {
    try {
      // Handle both string and number IDs, especially large CockroachDB IDs
      let searchId: string;
      
      if (typeof id === 'number') {
        searchId = id.toString();
      } else {
        searchId = id;
      }
      
      console.log(`🔍 Searching for order with ID: ${searchId} (type: ${typeof searchId})`);
      
      // Use raw query for better large integer handling
      const result = await this.orderRepository.query(
        'SELECT * FROM "order" WHERE id = $1 LIMIT 1',
        [searchId]
      );
      
      if (result && result.length > 0) {
        // Convert the raw result back to Order entity
        const rawOrder = result[0];
        const order = this.orderRepository.create({
          id: rawOrder.id,
          userId: rawOrder.userId,
          eventId: rawOrder.eventId,
          categoryId: rawOrder.categoryId,
          quantity: rawOrder.quantity,
          unitPrice: parseFloat(rawOrder.unitPrice),
          totalPrice: parseFloat(rawOrder.totalPrice),
          status: rawOrder.status,
          eventName: rawOrder.eventName,
          categoryName: rawOrder.categoryName,
          notes: rawOrder.notes,
          createdAt: rawOrder.createdAt,
          updatedAt: rawOrder.updatedAt,
        });
        
        console.log(`✅ Order found: ${order.id}`);
        return order;
      }
      
      console.log(`❌ Order not found with ID: ${searchId}`);
      return null;
      
    } catch (error) {
      console.error(`❌ Error finding order by ID ${id}:`, error.message);
      return null;
    }
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

  async updateStatus(id: string | number, status: OrderStatus, notes?: string): Promise<Order | null> {
    // Convert to string if number is passed (for backward compatibility)
    const searchId = typeof id === 'number' ? id.toString() : id;
    await this.orderRepository.update(searchId, { status, notes });
    return this.findById(searchId);
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

  // Raw query method for health checks and custom queries
  async query(sql: string, parameters?: any[]): Promise<any> {
    return this.orderRepository.query(sql, parameters);
  }
}

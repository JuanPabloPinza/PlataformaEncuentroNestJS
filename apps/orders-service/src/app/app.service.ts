import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { OrderRepository } from './repositories/order.repository';
import { CreateOrderDto, OrderResponseDto } from './dto/order.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  constructor(
    private readonly orderRepository: OrderRepository,
    @Inject('EVENTS_SERVICE_CLIENT') private readonly eventsClient: ClientProxy,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    try {
      // First, get event and ticket category details from events-service
      const event = await firstValueFrom(
        this.eventsClient.send('get-event-by-id', createOrderDto.eventId)
      );

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const ticketCategories = await firstValueFrom(
        this.eventsClient.send('get-ticket-categories', createOrderDto.eventId)
      );

      const category = ticketCategories.find(cat => cat.id === createOrderDto.categoryId);
      if (!category) {
        throw new NotFoundException('Ticket category not found');
      }

      // Check if enough tickets are available
      if (category.availableSeats < createOrderDto.quantity) {
        throw new BadRequestException(`Not enough tickets available. Only ${category.availableSeats} tickets left`);
      }

      // Calculate total price
      const totalPrice = category.price * createOrderDto.quantity;

      // Create order with PENDING status
      const order = await this.orderRepository.create({
        userId: createOrderDto.userId,
        eventId: createOrderDto.eventId,
        categoryId: createOrderDto.categoryId,
        quantity: createOrderDto.quantity,
        unitPrice: category.price,
        totalPrice,
        status: OrderStatus.PENDING,
        eventName: event.eventName,
        categoryName: category.categoryName,
        notes: createOrderDto.notes,
      });

      // Reserve tickets in events-service
      const reserveSuccess = await firstValueFrom(
        this.eventsClient.send('reserve-tickets', {
          eventId: createOrderDto.eventId,
          categoryId: createOrderDto.categoryId,
          quantity: createOrderDto.quantity,
        })
      );

      if (!reserveSuccess) {
        throw new BadRequestException('Failed to reserve tickets');
      }

      // Update order status to CONFIRMED
      await this.orderRepository.updateStatus(order.id, OrderStatus.CONFIRMED);

      return this.mapOrderToResponse(await this.orderRepository.findById(order.id));
    } catch (error) {
      throw error;
    }
  }

  async getOrderById(id: number): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return this.mapOrderToResponse(order);
  }

  async getOrdersByUserId(userId: number): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.findByUserId(userId);
    return orders.map(order => this.mapOrderToResponse(order));
  }

  async getOrdersByEventId(eventId: number): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.findByEventId(eventId);
    return orders.map(order => this.mapOrderToResponse(order));
  }

  async getAllOrders(): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.findAll();
    return orders.map(order => this.mapOrderToResponse(order));
  }

  async cancelOrder(id: number): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed orders can be cancelled');
    }

    // Release tickets in events-service
    await firstValueFrom(
      this.eventsClient.send('release-tickets', {
        categoryId: order.categoryId,
        quantity: order.quantity,
      })
    );

    // Update order status to CANCELLED
    const cancelledOrder = await this.orderRepository.updateStatus(
      id, 
      OrderStatus.CANCELLED,
      'Order cancelled by user'
    );

    return this.mapOrderToResponse(cancelledOrder);
  }

  private mapOrderToResponse(order: Order): OrderResponseDto {
    return {
      id: order.id,
      userId: order.userId,
      eventId: order.eventId,
      categoryId: order.categoryId,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      totalPrice: order.totalPrice,
      status: order.status,
      eventName: order.eventName,
      categoryName: order.categoryName,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}

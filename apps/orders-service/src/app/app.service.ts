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
    @Inject('REALTIME_SERVICE_CLIENT') private readonly realtimeClient: ClientProxy,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    try {
      console.log('📝 Creating order with data:', createOrderDto);
      
      // First, get event and ticket category details from events-service
      console.log('🎫 Fetching event details for eventId:', createOrderDto.eventId);
      const event = await firstValueFrom(
        this.eventsClient.send('get-event-by-id', createOrderDto.eventId)
      );

      if (!event) {
        console.log('❌ Event not found for eventId:', createOrderDto.eventId);
        throw new NotFoundException('Event not found');
      }

      console.log('✅ Event found:', event.eventName);

      console.log('🎟️ Fetching ticket categories for eventId:', createOrderDto.eventId);
      const ticketCategories = await firstValueFrom(
        this.eventsClient.send('get-ticket-categories', createOrderDto.eventId)
      );

      console.log('📋 Ticket categories found:', ticketCategories?.length || 0);

      const category = ticketCategories.find(cat => cat.id === createOrderDto.categoryId);
      if (!category) {
        console.log('❌ Ticket category not found for categoryId:', createOrderDto.categoryId);
        throw new NotFoundException('Ticket category not found');
      }

      console.log('✅ Category found:', category.categoryName, 'Available seats:', category.availableSeats);

      // Check if enough tickets are available
      if (category.availableSeats < createOrderDto.quantity) {
        console.log('❌ Not enough tickets. Requested:', createOrderDto.quantity, 'Available:', category.availableSeats);
        throw new BadRequestException(`Not enough tickets available. Only ${category.availableSeats} tickets left`);
      }

      // Calculate total price
      const totalPrice = category.price * createOrderDto.quantity;
      console.log('💰 Calculated total price:', totalPrice);

      // Create order with PENDING status
      console.log('💾 Creating order in database...');
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

      console.log('✅ Order created with ID:', order.id);

      // Reserve tickets in events-service
      console.log('🔒 Reserving tickets in events-service...');
      const reserveSuccess = await firstValueFrom(
        this.eventsClient.send('reserve-tickets', {
          eventId: createOrderDto.eventId,
          categoryId: createOrderDto.categoryId,
          quantity: createOrderDto.quantity,
        })
      );

      if (!reserveSuccess) {
        console.log('❌ Failed to reserve tickets');
        throw new BadRequestException('Failed to reserve tickets');
      }

      console.log('✅ Tickets reserved successfully');

      // Update order status to CONFIRMED
      console.log('🔄 Updating order status to CONFIRMED...');
      await this.orderRepository.updateStatus(order.id, OrderStatus.CONFIRMED);

      // Notify realtime service about the successful order
      try {
        console.log('📡 Notifying realtime service about order completion...');
        await firstValueFrom(
          this.realtimeClient.emit('order-completed', {
            orderId: order.id,
            eventId: createOrderDto.eventId,
            categoryId: createOrderDto.categoryId,
            quantity: createOrderDto.quantity,
            userId: createOrderDto.userId,
          })
        );
        console.log('✅ Realtime service notified');
      } catch (notificationError) {
        console.warn('⚠️ Failed to notify realtime service:', notificationError.message);
        // Don't fail the order if notification fails
      }

      console.log('🎉 Order creation completed successfully');
      
      // Find the created order with proper error handling
      const createdOrder = await this.orderRepository.findById(order.id);
      if (!createdOrder) {
        console.error(`❌ Failed to retrieve created order with ID: ${order.id}`);
        throw new Error(`Order was created but could not be retrieved. ID: ${order.id}`);
      }
      
      return this.mapOrderToResponse(createdOrder);
    } catch (error) {
      console.error('💥 Error creating order:', error.message);
      console.error('📊 Error stack:', error.stack);
      throw error;
    }
  }

  async createOrderWithLock(createOrderDto: CreateOrderDto & { lockId?: string }): Promise<OrderResponseDto> {
    try {
      console.log('🔐 Creating order with lock confirmation:', createOrderDto);

      // If lockId is provided, confirm the lock first
      if (createOrderDto.lockId) {
        console.log('🔒 Confirming ticket lock:', createOrderDto.lockId);
        try {
          const lockConfirmed = await firstValueFrom(
            this.realtimeClient.send('confirm-lock', {
              lockId: createOrderDto.lockId,
              userId: createOrderDto.userId,
            })
          );

          if (!lockConfirmed) {
            console.log('❌ Lock confirmation failed');
            throw new BadRequestException('Ticket lock has expired or is invalid');
          }
          console.log('✅ Lock confirmed successfully');
        } catch (lockError) {
          console.error('❌ Error confirming lock:', lockError);
          throw new BadRequestException('Failed to confirm ticket lock');
        }
      }

      // Proceed with normal order creation
      const order = await this.createOrder(createOrderDto);

      console.log('🎉 Order with lock confirmation completed successfully');
      return order;
    } catch (error) {
      console.error('💥 Error creating order with lock:', error.message);
      throw error;
    }
  }

  async getOrderById(id: string | number): Promise<OrderResponseDto> {
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

  async cancelOrder(id: string | number): Promise<OrderResponseDto> {
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

    // Notify realtime service about the cancellation
    try {
      console.log('📡 Notifying realtime service about order cancellation...');
      await firstValueFrom(
        this.realtimeClient.emit('order-cancelled', {
          orderId: id,
          eventId: order.eventId,
          categoryId: order.categoryId,
          quantity: order.quantity,
          userId: order.userId,
        })
      );
      console.log('✅ Realtime service notified about cancellation');
    } catch (notificationError) {
      console.warn('⚠️ Failed to notify realtime service about cancellation:', notificationError.message);
      // Don't fail the cancellation if notification fails
    }

    return this.mapOrderToResponse(cancelledOrder);
  }

  // Health check method for database connectivity
  async healthCheck(): Promise<{ database: string; version: string }> {
    try {
      // Simple query to test database connectivity
      const result = await this.orderRepository.query('SELECT version()');
      return {
        database: 'CockroachDB/PostgreSQL',
        version: result[0]?.version || 'Unknown'
      };
    } catch (error) {
      console.error('❌ Database health check failed:', error.message);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  private mapOrderToResponse(order: Order): OrderResponseDto {
    if (!order) {
      throw new Error('Order is null or undefined');
    }
    
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

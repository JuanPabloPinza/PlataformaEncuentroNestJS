import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { CreateOrderDto } from './dto/order.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('create-order')
  async createOrder(@Payload() createOrderDto: CreateOrderDto) {
    return this.appService.createOrder(createOrderDto);
  }

  @MessagePattern('create-order-with-lock')
  async createOrderWithLock(@Payload() createOrderDto: CreateOrderDto & { lockId?: string }) {
    return this.appService.createOrderWithLock(createOrderDto);
  }

  @MessagePattern('get-order-by-id')
  async getOrderById(@Payload() id: string | number) {
    return this.appService.getOrderById(id);
  }

  @MessagePattern('get-orders-by-user')
  async getOrdersByUserId(@Payload() userId: number) {
    return this.appService.getOrdersByUserId(userId);
  }

  @MessagePattern('get-orders-by-event')
  async getOrdersByEventId(@Payload() eventId: number) {
    return this.appService.getOrdersByEventId(eventId);
  }

  @MessagePattern('get-all-orders')
  async getAllOrders() {
    return this.appService.getAllOrders();
  }

  @MessagePattern('cancel-order')
  async cancelOrder(@Payload() id: string | number) {
    return this.appService.cancelOrder(id);
  }

  // Health check endpoint for database connectivity
  @Get('health')
  async healthCheck() {
    try {
      const result = await this.appService.healthCheck();
      return {
        status: 'ok',
        database: result.database,
        timestamp: new Date().toISOString(),
        service: 'orders-service'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
        service: 'orders-service'
      };
    }
  }
}

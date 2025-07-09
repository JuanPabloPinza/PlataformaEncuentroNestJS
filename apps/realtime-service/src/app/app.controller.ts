import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { RealtimeGateway } from './gateways/realtime.gateway';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('stats')
  getStats() {
    return {
      service: 'realtime-service',
      status: 'active',
      ...this.realtimeGateway.getStats()
    };
  }

  // RabbitMQ message handlers for external service integration
  @MessagePattern('confirm-ticket-lock')
  async confirmTicketLock(@Payload() data: { lockId: string }) {
    return await this.realtimeGateway.confirmTicketLock(data.lockId);
  }

  @MessagePattern('confirm-lock')
  async confirmLock(@Payload() data: { lockId: string; userId: number }) {
    return await this.realtimeGateway.confirmLock(data.lockId, data.userId);
  }

  @MessagePattern('release-ticket-lock')
  async releaseTicketLock(@Payload() data: { lockId: string }) {
    return await this.realtimeGateway.releaseTicketLock(data.lockId);
  }

  @MessagePattern('order-completed')
  async handleOrderCompleted(@Payload() data: { 
    orderId: number; 
    eventId: number; 
    categoryId: number; 
    quantity: number; 
    userId: number; 
  }) {
    console.log('📨 [Realtime Service] Received order completed event:', data);
    await this.realtimeGateway.handleOrderCompleted(data);
  }

  @MessagePattern('order-cancelled')
  async handleOrderCancelled(@Payload() data: { 
    orderId: number; 
    eventId: number; 
    categoryId: number; 
    quantity: number; 
    userId: number; 
  }) {
    console.log('📨 [Realtime Service] Received order cancelled event:', data);
    await this.realtimeGateway.handleOrderCancelled(data);
  }

  @MessagePattern('get-realtime-stats')
  async getRealtimeStats() {
    return this.realtimeGateway.getStats();
  }
}

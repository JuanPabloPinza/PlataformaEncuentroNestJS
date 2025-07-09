import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  constructor(
    @Inject('EVENTS_SERVICE_CLIENT') private readonly eventsClient: ClientProxy,
    @Inject('ORDERS_SERVICE_CLIENT') private readonly ordersClient: ClientProxy,
  ) {}

  getData(): { message: string } {
    return { message: 'Realtime Service is running!' };
  }

  // Integration methods with other services
  async getEventTicketAvailability(eventId: number) {
    try {
      const ticketCategories = await firstValueFrom(
        this.eventsClient.send('get-ticket-categories', eventId)
      );
      return ticketCategories;
    } catch (error) {
      console.error('❌ [Realtime Service] Error getting ticket availability:', error);
      return null;
    }
  }

  async notifyOrderCreated(orderData: any) {
    try {
      // This could be used to confirm locks when orders are created
      console.log('📦 [Realtime Service] Order created notification:', orderData);
      return true;
    } catch (error) {
      console.error('❌ [Realtime Service] Error handling order notification:', error);
      return false;
    }
  }

  async validateEventExists(eventId: number): Promise<boolean> {
    try {
      const event = await firstValueFrom(
        this.eventsClient.send('get-event-by-id', eventId)
      );
      return !!event;
    } catch (error) {
      console.error('❌ [Realtime Service] Error validating event:', error);
      return false;
    }
  }
}

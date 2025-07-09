import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { TicketLockService } from '../services/ticket-lock.service';
import {
  LockTicketsDto,
  UnlockTicketsDto,
  JoinEventRoomDto,
  TicketAvailabilityUpdate,
  UserSessionInfo
} from '../dto/realtime.dto';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  sessionId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this properly for production
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/realtime',
})
@Injectable()
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedUsers: Map<string, UserSessionInfo> = new Map();

  constructor(private readonly ticketLockService: TicketLockService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      console.log(`🔌 [Realtime Service] Client connected: ${client.id}`);
      
      // TODO: Authenticate user from JWT token in handshake
      // For now, we'll extract from query params
      const token = client.handshake.auth?.['token'] || client.handshake.query?.['token'];
      const userId = client.handshake.query?.['userId'] as string;
      
      if (!userId) {
        console.log('❌ [Realtime Service] No userId provided, disconnecting client');
        client.disconnect();
        return;
      }

      client.userId = parseInt(userId);
      client.sessionId = client.id;

      // Store user session
      const sessionInfo: UserSessionInfo = {
        userId: client.userId,
        sessionId: client.sessionId,
        eventId: 0, // Will be set when joining event rooms
        locks: [],
        connectedAt: new Date(),
        lastActivity: new Date(),
      };

      this.connectedUsers.set(client.id, sessionInfo);

      // Send connection confirmation
      client.emit('connected', {
        success: true,
        sessionId: client.sessionId,
        message: 'Connected to realtime service'
      });

      console.log(`✅ [Realtime Service] User ${client.userId} connected with session ${client.sessionId}`);
    } catch (error) {
      console.error('❌ [Realtime Service] Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    console.log(`🔌 [Realtime Service] Client disconnected: ${client.id}`);

    if (client.userId && client.sessionId) {
      // Release all locks for this user session
      const releasedLocks = this.ticketLockService.releaseUserLocks(client.userId, client.sessionId);
      
      if (releasedLocks > 0) {
        // Notify other users in the same event rooms about availability updates
        await this.broadcastAvailabilityUpdates(client.userId);
      }

      // Remove from connected users
      this.connectedUsers.delete(client.id);

      console.log(`👋 [Realtime Service] User ${client.userId} disconnected, released ${releasedLocks} locks`);
    }
  }

  @SubscribeMessage('join-event-room')
  async handleJoinEventRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinEventRoomDto
  ) {
    try {
      console.log(`🏠 [Realtime Service] User ${data.userId} joining event room ${data.eventId}`);

      if (!client.userId || client.userId !== data.userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      const roomName = `event_${data.eventId}`;
      await client.join(roomName);

      // Update session info
      const sessionInfo = this.connectedUsers.get(client.id);
      if (sessionInfo) {
        sessionInfo.eventId = data.eventId;
        sessionInfo.lastActivity = new Date();
      }

      client.emit('joined-event-room', {
        success: true,
        eventId: data.eventId,
        message: `Joined event ${data.eventId} room`
      });

      // Send current availability info for this event
      await this.sendEventAvailability(client, data.eventId);

      console.log(`✅ [Realtime Service] User ${data.userId} joined event room ${data.eventId}`);
    } catch (error) {
      console.error('❌ [Realtime Service] Error joining event room:', error);
      client.emit('error', { message: 'Failed to join event room' });
    }
  }

  @SubscribeMessage('leave-event-room')
  async handleLeaveEventRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { eventId: number }
  ) {
    try {
      const roomName = `event_${data.eventId}`;
      await client.leave(roomName);

      client.emit('left-event-room', {
        success: true,
        eventId: data.eventId,
        message: `Left event ${data.eventId} room`
      });

      console.log(`👋 [Realtime Service] User ${client.userId} left event room ${data.eventId}`);
    } catch (error) {
      console.error('❌ [Realtime Service] Error leaving event room:', error);
      client.emit('error', { message: 'Failed to leave event room' });
    }
  }

  @SubscribeMessage('lock-tickets')
  async handleLockTickets(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: LockTicketsDto
  ) {
    try {
      console.log(`🔒 [Realtime Service] Lock tickets request from user ${client.userId}`);

      if (!client.userId || client.userId !== data.userId) {
        client.emit('lock-tickets-response', {
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      // Add session ID to the request
      const lockRequest = {
        ...data,
        sessionId: client.sessionId!
      };

      const response = await this.ticketLockService.lockTickets(lockRequest);

      // Send response to the requesting client
      client.emit('lock-tickets-response', response);

      if (response.success) {
        // Broadcast availability update to all users in the event room
        await this.broadcastAvailabilityUpdate(data.eventId, data.categoryId);
        
        // Update user session locks
        const sessionInfo = this.connectedUsers.get(client.id);
        if (sessionInfo) {
          sessionInfo.locks = this.ticketLockService.getUserLocks(client.userId);
          sessionInfo.lastActivity = new Date();
        }
      }

      console.log(`🔒 [Realtime Service] Lock tickets result:`, response.success ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      console.error('❌ [Realtime Service] Error locking tickets:', error);
      client.emit('lock-tickets-response', {
        success: false,
        message: 'Internal server error'
      });
    }
  }

  @SubscribeMessage('unlock-tickets')
  async handleUnlockTickets(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: UnlockTicketsDto
  ) {
    try {
      console.log(`🔓 [Realtime Service] Unlock tickets request from user ${client.userId}`);

      if (!client.userId || client.userId !== data.userId) {
        client.emit('unlock-tickets-response', {
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const unlockRequest = {
        ...data,
        sessionId: client.sessionId!
      };

      const success = await this.ticketLockService.unlockTickets(unlockRequest);

      client.emit('unlock-tickets-response', {
        success,
        message: success ? 'Tickets unlocked successfully' : 'No tickets found to unlock'
      });

      if (success) {
        // Broadcast availability update to all users in the event room
        await this.broadcastAvailabilityUpdate(data.eventId, data.categoryId);
        
        // Update user session locks
        const sessionInfo = this.connectedUsers.get(client.id);
        if (sessionInfo) {
          sessionInfo.locks = this.ticketLockService.getUserLocks(client.userId);
          sessionInfo.lastActivity = new Date();
        }
      }

      console.log(`🔓 [Realtime Service] Unlock tickets result:`, success ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      console.error('❌ [Realtime Service] Error unlocking tickets:', error);
      client.emit('unlock-tickets-response', {
        success: false,
        message: 'Internal server error'
      });
    }
  }

  @SubscribeMessage('get-my-locks')
  handleGetMyLocks(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) {
      client.emit('my-locks-response', { locks: [] });
      return;
    }

    const locks = this.ticketLockService.getUserLocks(client.userId);
    client.emit('my-locks-response', { locks });
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() client: AuthenticatedSocket) {
    const sessionInfo = this.connectedUsers.get(client.id);
    if (sessionInfo) {
      sessionInfo.lastActivity = new Date();
    }
    client.emit('heartbeat-response', { timestamp: new Date() });
  }

  // Public method to confirm a lock (called from orders service)
  async confirmTicketLock(lockId: string): Promise<boolean> {
    const success = this.ticketLockService.confirmLock(lockId);
    if (success) {
      console.log(`✅ [Realtime Service] Lock confirmed externally: ${lockId}`);
    }
    return success;
  }

  // Public method to release a lock (called from external services)
  async releaseTicketLock(lockId: string): Promise<boolean> {
    const success = this.ticketLockService.releaseLock(lockId);
    if (success) {
      console.log(`🔓 [Realtime Service] Lock released externally: ${lockId}`);
    }
    return success;
  }

  private async broadcastAvailabilityUpdate(eventId: number, categoryId: number) {
    try {
      const availableTickets = await this.ticketLockService.getAvailableTicketsWithLocks(eventId, categoryId);
      const lockedQuantity = this.ticketLockService.getLockedQuantityForCategory(eventId, categoryId);
      
      const update: TicketAvailabilityUpdate = {
        eventId,
        categoryId,
        availableTickets,
        lockedTickets: lockedQuantity,
        totalTickets: availableTickets + lockedQuantity, // This is approximate
        timestamp: new Date()
      };

      const roomName = `event_${eventId}`;
      this.server.to(roomName).emit('availability-update', update);

      console.log(`📡 [Realtime Service] Broadcasted availability update for event ${eventId}, category ${categoryId}:`, update);
    } catch (error) {
      console.error('❌ [Realtime Service] Error broadcasting availability update:', error);
    }
  }

  private async broadcastAvailabilityUpdates(userId: number) {
    // This could be optimized to only update specific events/categories
    // For now, we'll just log that updates should be sent
    console.log(`📡 [Realtime Service] Should broadcast availability updates after user ${userId} disconnect`);
  }

  private async sendEventAvailability(client: AuthenticatedSocket, eventId: number) {
    try {
      // TODO: Get all categories for this event from events-service
      // For now, we'll send a placeholder
      console.log(`📊 [Realtime Service] Sending availability info for event ${eventId} to user ${client.userId}`);
    } catch (error) {
      console.error('❌ [Realtime Service] Error sending event availability:', error);
    }
  }

  // Method to get service statistics
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      ticketLocks: this.ticketLockService.getStats()
    };
  }

  // Methods for external service integration
  async confirmLock(lockId: string, userId: number): Promise<boolean> {
    console.log(`🔑 [Realtime Service] Confirming lock ${lockId} for user ${userId}`);
    return this.ticketLockService.confirmLock(lockId);
  }

  async handleOrderCompleted(data: { 
    orderId: number; 
    eventId: number; 
    categoryId: number; 
    quantity: number; 
    userId: number; 
  }) {
    console.log(`✅ [Realtime Service] Order completed, broadcasting availability update:`, data);
    
    // Broadcast availability update to all users in the event room
    await this.broadcastAvailabilityUpdate(data.eventId, data.categoryId);
    
    // Emit order completion to the specific user if they're connected
    const userSessions = Array.from(this.connectedUsers.entries())
      .filter(([_, session]) => session.userId === data.userId);
    
    for (const [socketId, session] of userSessions) {
      this.server.to(socketId).emit('order-completed', {
        orderId: data.orderId,
        eventId: data.eventId,
        categoryId: data.categoryId,
        quantity: data.quantity,
        message: 'Your order has been completed successfully!'
      });
    }
  }

  async handleOrderCancelled(data: { 
    orderId: number; 
    eventId: number; 
    categoryId: number; 
    quantity: number; 
    userId: number; 
  }) {
    console.log(`🚫 [Realtime Service] Order cancelled, broadcasting availability update:`, data);
    
    // Broadcast availability update to all users in the event room
    await this.broadcastAvailabilityUpdate(data.eventId, data.categoryId);
    
    // Emit order cancellation to the specific user if they're connected
    const userSessions = Array.from(this.connectedUsers.entries())
      .filter(([_, session]) => session.userId === data.userId);
    
    for (const [socketId, session] of userSessions) {
      this.server.to(socketId).emit('order-cancelled', {
        orderId: data.orderId,
        eventId: data.eventId,
        categoryId: data.categoryId,
        quantity: data.quantity,
        message: 'Your order has been cancelled. Tickets are now available again.'
      });
    }
  }
}

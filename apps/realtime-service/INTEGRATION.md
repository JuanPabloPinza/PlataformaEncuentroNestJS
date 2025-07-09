# Integration Guide: Realtime Service with Orders Service

## Overview
This guide explains how to integrate the realtime-service with the orders-service to provide seamless ticket locking and real-time updates during the order process.

## Integration Points

### 1. Order Creation Flow with Locking

**Current Flow:**
```
User → API Gateway → Orders Service → Events Service → Database
```

**Enhanced Flow with Realtime Service:**
```
User → Frontend (WebSocket) → Realtime Service (Lock Tickets)
      ↓
User → API Gateway → Orders Service → Confirm Lock → Database
                                   ↓
                        Realtime Service (Notify Success)
```

### 2. ✅ COMPLETED INTEGRATIONS

#### ✅ Orders Service Integration

The orders-service has been updated to:
- Include realtime-service client configuration
- Send lock confirmations during order creation
- Notify realtime-service of order completion/cancellation
- Support `create-order-with-lock` for lock-based orders

#### ✅ Realtime Service Integration

The realtime-service has been updated to:
- Get real ticket availability from events-service
- Handle RabbitMQ messages from orders-service
- Broadcast real-time availability updates
- Manage ticket locks with real data

#### ✅ API Gateway Integration

The API Gateway has been updated to:
- Support `/orders/with-lock` endpoint for lock-based orders
- Pass lock IDs from frontend to orders-service

### 3. Complete Order Flow with Realtime Integration

#### Step 1: User Connects to Realtime Service
```javascript
const socket = io('ws://localhost:8880/realtime', {
  auth: { token: 'jwt-token' },
  query: { userId: '123' }
});

socket.on('connected', (data) => {
  console.log('Connected to realtime service:', data);
});
```

#### Step 2: Join Event Room
```javascript
socket.emit('join-event-room', {
  userId: 123,
  eventId: 1
});

socket.on('joined-event-room', (data) => {
  console.log('Joined event room:', data);
});
```

#### Step 3: Lock Tickets
```javascript
socket.emit('lock-tickets', {
  userId: 123,
  eventId: 1,
  categoryId: 1,
  quantity: 2
});

socket.on('lock-tickets-response', (response) => {
  if (response.success) {
    console.log('Tickets locked:', response.lockId);
    // Proceed to order creation
    createOrderWithLock(response.lockId);
  }
});
```

#### Step 4: Create Order with Lock
```javascript
async function createOrderWithLock(lockId) {
  const response = await fetch('/api/orders/with-lock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({
      eventId: 1,
      categoryId: 1,
      quantity: 2,
      lockId: lockId,
      notes: 'VIP tickets'
    })
  });
  
  const order = await response.json();
  console.log('Order created:', order);
}
```

#### Step 5: Listen for Real-time Updates
```javascript
// Listen for availability updates
socket.on('availability-update', (update) => {
  console.log('Ticket availability updated:', update);
  updateUI(update);
});

// Listen for order completion
socket.on('order-completed', (data) => {
  console.log('Order completed successfully:', data);
  showSuccessMessage(data);
});

// Listen for order cancellation
socket.on('order-cancelled', (data) => {
  console.log('Order was cancelled:', data);
  showCancellationMessage(data);
});
```

### 4. API Endpoints

#### Orders API

##### Create Order (Standard)
```
POST /api/orders
Authorization: Bearer <jwt-token>

{
  "eventId": 1,
  "categoryId": 1,
  "quantity": 2,
  "notes": "Optional notes"
}
```

##### Create Order with Lock
```
POST /api/orders/with-lock
Authorization: Bearer <jwt-token>

{
  "eventId": 1,
  "categoryId": 1,
  "quantity": 2,
  "lockId": "uuid-lock-id",
  "notes": "Optional notes"
}
```

##### Cancel Order
```
POST /api/orders/{orderId}/cancel
Authorization: Bearer <jwt-token>
```

#### Realtime WebSocket Events

##### Client → Server Events
- `join-event-room`: Join an event room for updates
- `leave-event-room`: Leave an event room
- `lock-tickets`: Lock tickets for a category
- `unlock-tickets`: Unlock previously locked tickets
- `heartbeat`: Keep connection alive

##### Server → Client Events
- `connected`: Connection confirmation
- `joined-event-room`: Event room join confirmation
- `lock-tickets-response`: Lock operation result
- `unlock-tickets-response`: Unlock operation result
- `availability-update`: Real-time ticket availability
- `order-completed`: Order completion notification
- `order-cancelled`: Order cancellation notification

### 5. Error Handling

#### Lock Expiration
Locks automatically expire after 5 minutes. The frontend should:
```javascript
let lockExpirationTimer;

socket.on('lock-tickets-response', (response) => {
  if (response.success) {
    // Set timer for lock expiration
    const expirationTime = new Date(response.expiresAt);
    const timeUntilExpiration = expirationTime.getTime() - Date.now();
    
    lockExpirationTimer = setTimeout(() => {
      showLockExpiredMessage();
      // Optionally try to lock again
    }, timeUntilExpiration);
  }
});
```

#### Connection Loss
Handle disconnections gracefully:
```javascript
socket.on('disconnect', () => {
  console.log('Disconnected from realtime service');
  // All locks are automatically released
  clearTimeout(lockExpirationTimer);
  showDisconnectedMessage();
});

socket.on('reconnect', () => {
  console.log('Reconnected to realtime service');
  // Re-join event rooms if needed
  rejoinEventRooms();
});
```

### 6. Production Considerations

#### Security
- Implement JWT validation in WebSocket handshake
- Add rate limiting for lock operations
- Validate user permissions for events

#### Scaling
- Use Redis for distributed lock storage
- Implement horizontal scaling for realtime-service
- Add load balancing for WebSocket connections

#### Monitoring
- Track lock success/failure rates
- Monitor connection counts and message throughput
- Alert on high lock contention or failures

### 7. Testing the Integration

Start all services:
```bash
# Terminal 1: Events Service
nx serve events-service

# Terminal 2: Orders Service  
nx serve orders-service

# Terminal 3: Realtime Service
nx serve realtime-service

# Terminal 4: API Gateway
nx serve api-gateway
```

Test the flow using the provided test client at:
`apps/realtime-service/examples/test-client.html`

### 8. Troubleshooting

#### Common Issues

1. **Lock fails immediately**
   - Check if events-service is running
   - Verify ticket availability in database
   - Check console logs for errors

2. **Orders not completing**
   - Verify RabbitMQ is running
   - Check orders-service logs
   - Ensure lock ID is being passed correctly

3. **Real-time updates not working**
   - Check WebSocket connection
   - Verify user joined event room
   - Check realtime-service logs

#### Debug Commands
```bash
# Check RabbitMQ queues
curl -u admin:admin http://localhost:15672/api/queues

# Check realtime service stats
curl http://localhost:8880/stats

# View orders service health
curl http://localhost:8878/
```

```typescript
@Module({
  imports: [
    // ...existing imports...
    ClientsModule.register([
      {
        name: 'REALTIME_SERVICE_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin@127.0.0.1:5672'],
          queue: 'realtime_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  // ...
})
```

#### Update Order Creation Logic

Update `apps/orders-service/src/app/app.service.ts`:

```typescript
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AppService {
  constructor(
    // ...existing dependencies...
    @Inject('REALTIME_SERVICE_CLIENT') private readonly realtimeClient: ClientProxy,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    try {
      console.log('📝 Creating order with realtime integration:', createOrderDto);
      
      // Check if user has valid locks for these tickets
      const lockValidation = await firstValueFrom(
        this.realtimeClient.send('validate-user-locks', {
          userId: createOrderDto.userId,
          eventId: createOrderDto.eventId,
          categoryId: createOrderDto.categoryId,
          quantity: createOrderDto.quantity
        })
      );

      if (!lockValidation.valid) {
        throw new BadRequestException(
          lockValidation.message || 'No valid ticket locks found. Please select tickets first.'
        );
      }

      // Continue with existing order creation logic...
      const event = await firstValueFrom(
        this.eventsClient.send('get-event-by-id', createOrderDto.eventId)
      );
      // ... rest of validation ...

      // Create order in database
      const order = await this.orderRepository.create({
        // ... order data ...
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
        // If reservation fails, we should not confirm the lock
        throw new BadRequestException('Failed to reserve tickets');
      }

      // Confirm the lock in realtime service (converts lock to confirmed)
      const lockConfirmed = await firstValueFrom(
        this.realtimeClient.send('confirm-ticket-lock', {
          lockId: lockValidation.lockId
        })
      );

      if (!lockConfirmed) {
        console.warn('⚠️ Failed to confirm lock, but order was created');
      }

      // Update order status to CONFIRMED
      await this.orderRepository.updateStatus(order.id, OrderStatus.CONFIRMED);

      console.log('🎉 Order creation completed with realtime integration');
      return this.mapOrderToResponse(await this.orderRepository.findById(order.id));
      
    } catch (error) {
      console.error('💥 Error creating order:', error.message);
      
      // If order creation fails, release any locks
      if (createOrderDto.lockId) {
        try {
          await firstValueFrom(
            this.realtimeClient.send('release-ticket-lock', {
              lockId: createOrderDto.lockId
            })
          );
        } catch (releaseError) {
          console.error('Failed to release lock on order failure:', releaseError);
        }
      }
      
      throw error;
    }
  }
}
```

#### Add Lock ID to Order DTO

Update `apps/orders-service/src/app/dto/order.dto.ts`:

```typescript
export interface CreateOrderDto {
  eventId: number;
  categoryId: number;
  quantity: number;
  userId: number;
  notes?: string;
  lockId?: string; // Add lock ID for validation
}
```

### 3. API Gateway Changes

#### Update Orders Controller

Update `apps/api-gateway/src/app/orders/orders.controller.ts`:

```typescript
@Post()
@UseGuards(AuthGuard)
async createOrder(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
  // Add user ID from JWT token
  const orderData = {
    ...createOrderDto,
    userId: req.user.userId
  };
  
  return await firstValueFrom(
    this.ordersClient.send('create-order', orderData)
  );
}
```

### 4. Realtime Service Message Handlers

Add these handlers to `apps/realtime-service/src/app/app.controller.ts`:

```typescript
@MessagePattern('validate-user-locks')
async validateUserLocks(@Payload() data: {
  userId: number;
  eventId: number;
  categoryId: number;
  quantity: number;
}) {
  return this.realtimeGateway.validateUserLocks(data);
}

@MessagePattern('get-user-locks')
async getUserLocks(@Payload() data: { userId: number }) {
  return this.realtimeGateway.getUserLocks(data.userId);
}
```

Add these methods to `apps/realtime-service/src/app/gateways/realtime.gateway.ts`:

```typescript
async validateUserLocks(data: {
  userId: number;
  eventId: number;
  categoryId: number;
  quantity: number;
}): Promise<{ valid: boolean; lockId?: string; message?: string }> {
  const userLocks = this.ticketLockService.getUserLocks(data.userId);
  
  // Find matching lock
  const matchingLock = userLocks.find(lock => 
    lock.eventId === data.eventId &&
    lock.categoryId === data.categoryId &&
    lock.quantity === data.quantity &&
    lock.status === 'active'
  );

  if (!matchingLock) {
    return {
      valid: false,
      message: 'No valid locks found for the requested tickets'
    };
  }

  // Check if lock is still valid (not expired)
  if (matchingLock.expiresAt <= new Date()) {
    return {
      valid: false,
      message: 'Ticket locks have expired. Please select tickets again.'
    };
  }

  return {
    valid: true,
    lockId: matchingLock.lockId
  };
}
```

### 5. Frontend Integration

#### WebSocket Connection Setup

```javascript
// Initialize WebSocket connection when user enters the event page
const socket = io('ws://localhost:8880/realtime', {
  auth: { token: localStorage.getItem('authToken') },
  query: { userId: currentUser.id }
});

// Join the event room
socket.emit('join-event-room', {
  eventId: eventId,
  userId: currentUser.id
});
```

#### Ticket Selection Flow

```javascript
// When user selects tickets
async function selectTickets(categoryId, quantity) {
  return new Promise((resolve, reject) => {
    // Request lock from realtime service
    socket.emit('lock-tickets', {
      eventId: currentEvent.id,
      categoryId: categoryId,
      quantity: quantity,
      userId: currentUser.id
    });

    // Wait for response
    socket.once('lock-tickets-response', (response) => {
      if (response.success) {
        console.log('Tickets locked:', response.lockId);
        
        // Update UI to show locked tickets
        updateTicketSelection(categoryId, quantity, response.lockId);
        
        // Start countdown timer for lock expiration
        startLockTimer(response.expiresAt);
        
        resolve(response);
      } else {
        console.error('Lock failed:', response.message);
        reject(new Error(response.message));
      }
    });
  });
}

// When user proceeds to checkout
async function proceedToCheckout(lockId) {
  try {
    const orderResponse = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        eventId: currentEvent.id,
        categoryId: selectedCategory.id,
        quantity: selectedQuantity,
        lockId: lockId // Include lock ID in order
      })
    });

    if (orderResponse.ok) {
      const order = await orderResponse.json();
      console.log('Order created:', order);
      
      // Redirect to confirmation page
      window.location.href = `/orders/${order.id}/confirmation`;
    } else {
      const error = await orderResponse.json();
      console.error('Order failed:', error);
      alert(`Order failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Order error:', error);
    alert('Order failed. Please try again.');
  }
}
```

#### Real-time Updates

```javascript
// Listen for availability updates
socket.on('availability-update', (update) => {
  // Update the UI to show current availability
  updateAvailabilityDisplay(update.categoryId, update.availableTickets);
});

// Handle other users' actions
socket.on('tickets-locked-by-other-user', (data) => {
  // Show that tickets are temporarily unavailable
  showTicketsTemporarilyUnavailable(data.categoryId, data.quantity);
});

socket.on('tickets-released-by-other-user', (data) => {
  // Show that tickets are available again
  showTicketsAvailableAgain(data.categoryId, data.quantity);
});
```

### 6. Testing the Integration

#### Test Scenario 1: Successful Order with Locks

1. User opens event page
2. WebSocket connects to realtime service
3. User selects 2 tickets in Gold category
4. Realtime service locks the tickets for 5 minutes
5. User proceeds to checkout
6. Orders service validates the lock
7. Order is created and lock is confirmed
8. Other users see updated availability

#### Test Scenario 2: Lock Expiration

1. User locks tickets but doesn't complete order within 5 minutes
2. Lock expires automatically
3. Tickets become available for other users
4. Original user gets notification that lock expired

#### Test Scenario 3: Concurrent Users

1. Multiple users try to select the same tickets
2. Only the first user gets the lock
3. Other users see "tickets temporarily unavailable"
4. When first user completes order, others see "sold out"
5. If first user abandons, others see tickets available again

### 7. Monitoring and Debugging

#### Realtime Service Logs
- Monitor lock creation/expiration rates
- Track WebSocket connection patterns
- Alert on high failure rates

#### Orders Service Integration
- Log lock validation results
- Monitor order success/failure rates with locks
- Track time between lock and order completion

#### Performance Metrics
- Lock-to-order conversion rate
- Average lock duration before order
- Concurrent user handling capacity

This integration provides a robust foundation for handling ticket concurrency while maintaining a smooth user experience.

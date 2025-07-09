# Realtime Service - WebSocket Ticket Concurrency Control

## Overview
The Realtime Service provides WebSocket-based real-time functionality for the ticketing system, focusing on ticket concurrency control and live updates. It prevents race conditions when multiple users try to purchase the same tickets simultaneously.

## Key Features

### 🔒 **Ticket Locking System**
- **Temporary Locks**: Users can lock tickets for 5 minutes while deciding to purchase
- **Concurrency Control**: Prevents overselling by managing active locks
- **Auto-Expiration**: Locks automatically expire and are cleaned up
- **Session-Based**: Locks are tied to user sessions and released on disconnect

### 🔌 **WebSocket Real-Time Communication**
- **Event Rooms**: Users join event-specific rooms for targeted updates
- **Live Availability**: Real-time ticket availability updates
- **Instant Feedback**: Immediate responses to lock/unlock requests
- **Session Management**: Track user connections and activity

### 📡 **Microservice Integration**
- **RabbitMQ Communication**: Integrates with other services via message queues
- **Events Service**: Gets ticket availability and validates events
- **Orders Service**: Confirms/releases locks when orders are processed

## Architecture

```
┌─────────────────┐    WebSocket    ┌──────────────────┐
│   Frontend      │◄──────────────►│ Realtime Service │
│   (Client)      │                 │   (Port 8880)    │
└─────────────────┘                 └──────────────────┘
                                            │
                                            │ RabbitMQ
                                            ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Events Service  │◄───┤ Message Queues   ├───►│ Orders Service  │
│   (Port 8879)   │    │   (RabbitMQ)     │    │ (RabbitMQ)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## WebSocket API

### Connection
```javascript
const socket = io('ws://localhost:8880/realtime', {
  auth: {
    token: 'JWT_TOKEN_HERE'
  },
  query: {
    userId: 123
  }
});
```

### Events

#### Client → Server

**Join Event Room**
```javascript
socket.emit('join-event-room', {
  eventId: 1,
  userId: 123
});
```

**Lock Tickets**
```javascript
socket.emit('lock-tickets', {
  eventId: 1,
  categoryId: 2,
  quantity: 2,
  userId: 123
});
```

**Unlock Tickets**
```javascript
socket.emit('unlock-tickets', {
  eventId: 1,
  categoryId: 2,
  quantity: 2,
  userId: 123
});
```

**Get My Locks**
```javascript
socket.emit('get-my-locks');
```

**Heartbeat**
```javascript
socket.emit('heartbeat');
```

#### Server → Client

**Connection Confirmed**
```javascript
socket.on('connected', (data) => {
  console.log('Connected:', data.sessionId);
});
```

**Lock Response**
```javascript
socket.on('lock-tickets-response', (response) => {
  if (response.success) {
    console.log('Tickets locked:', response.lockId);
    console.log('Expires at:', response.expiresAt);
  } else {
    console.log('Lock failed:', response.message);
  }
});
```

**Availability Updates**
```javascript
socket.on('availability-update', (update) => {
  console.log('Event:', update.eventId);
  console.log('Category:', update.categoryId);
  console.log('Available:', update.availableTickets);
  console.log('Locked:', update.lockedTickets);
});
```

**My Locks**
```javascript
socket.on('my-locks-response', (data) => {
  console.log('My active locks:', data.locks);
});
```

## Lock Lifecycle

```
┌─────────────┐    lock-tickets    ┌─────────────┐
│   AVAILABLE │───────────────────►│   LOCKED    │
└─────────────┘                    └─────────────┘
                                           │
                                           ▼
┌─────────────┐    confirm/expire  ┌─────────────┐
│  CONFIRMED  │◄───────────────────│  EXPIRED    │
│     OR      │                    │     OR      │
│  RELEASED   │                    │  RELEASED   │
└─────────────┘                    └─────────────┘
```

### Lock States
- **ACTIVE**: Lock is active and preventing others from locking these tickets
- **EXPIRED**: Lock has expired (5 minutes) and will be cleaned up
- **CONFIRMED**: Lock was confirmed by successful order creation
- **RELEASED**: Lock was manually released by user or system

## Integration Examples

### Frontend Integration
```javascript
// Initialize connection
const socket = io('ws://localhost:8880/realtime', {
  auth: { token: userToken },
  query: { userId: currentUser.id }
});

// Join event page
socket.emit('join-event-room', {
  eventId: eventId,
  userId: currentUser.id
});

// Lock tickets when user selects them
function lockTickets(categoryId, quantity) {
  socket.emit('lock-tickets', {
    eventId: currentEvent.id,
    categoryId: categoryId,
    quantity: quantity,
    userId: currentUser.id
  });
}

// Listen for real-time updates
socket.on('availability-update', (update) => {
  updateUI(update.categoryId, update.availableTickets);
});
```

### Orders Service Integration
```javascript
// When creating an order, confirm the lock
await firstValueFrom(
  this.realtimeClient.send('confirm-ticket-lock', { lockId })
);

// If order fails, release the lock
await firstValueFrom(
  this.realtimeClient.send('release-ticket-lock', { lockId })
);
```

## Configuration

### Environment Variables
```bash
# WebSocket Configuration
WEBSOCKET_PORT=8880
WEBSOCKET_CORS_ORIGIN=*

# RabbitMQ Configuration
RABBITMQ_URL=amqp://admin:admin@127.0.0.1:5672
REALTIME_QUEUE=realtime_queue

# Lock Configuration
LOCK_DURATION_MINUTES=5
CLEANUP_INTERVAL_MINUTES=1
```

### Service Ports
- **HTTP/WebSocket**: 8880
- **RabbitMQ Queue**: `realtime_queue`

## Statistics & Monitoring

### Health Check
```bash
curl http://localhost:8880/stats
```

**Response:**
```json
{
  "service": "realtime-service",
  "status": "active",
  "connectedUsers": 25,
  "ticketLocks": {
    "totalLocks": 150,
    "activeLocks": 45,
    "usersWithLocks": 30,
    "categoriesWithLocks": 12,
    "locksByStatus": {
      "active": 45,
      "expired": 20,
      "confirmed": 75,
      "released": 10
    }
  }
}
```

## Production Considerations

### Security
1. **Authentication**: Implement proper JWT validation in WebSocket handshake
2. **Rate Limiting**: Limit lock requests per user per time period
3. **CORS**: Configure WebSocket CORS properly for production domains

### Performance
1. **Connection Limits**: Monitor and limit concurrent WebSocket connections
2. **Memory Management**: Implement proper cleanup of expired locks and sessions
3. **Event Rooms**: Use Redis for scaling across multiple service instances

### Monitoring
1. **Lock Statistics**: Monitor lock creation/expiration rates
2. **Connection Health**: Track WebSocket connection/disconnection patterns
3. **Error Rates**: Monitor failed lock attempts and system errors

### Scaling
1. **Redis Integration**: Use Redis for shared state across service instances
2. **Load Balancing**: Implement sticky sessions for WebSocket connections
3. **Database Persistence**: Consider persisting critical locks to database

## Error Handling

### Common Errors
- **Unauthorized**: Invalid or missing authentication
- **Event Not Found**: Trying to lock tickets for non-existent event
- **Insufficient Tickets**: Not enough tickets available to lock
- **Duplicate Lock**: User already has locks for the same category
- **Connection Lost**: Handle client disconnections gracefully

### Client Error Handling
```javascript
socket.on('error', (error) => {
  console.error('Realtime error:', error.message);
  // Handle error appropriately in UI
});

socket.on('lock-tickets-response', (response) => {
  if (!response.success) {
    showErrorMessage(response.message);
  }
});
```

## Testing

### WebSocket Testing with Postman/Insomnia
1. Connect to `ws://localhost:8880/realtime`
2. Send authentication in handshake
3. Test lock/unlock functionality
4. Verify real-time updates

### Load Testing
- Test concurrent lock attempts
- Verify cleanup of expired locks
- Test connection handling under load

This realtime service provides a robust foundation for handling ticket concurrency in a high-traffic ticketing system while maintaining real-time user experience.

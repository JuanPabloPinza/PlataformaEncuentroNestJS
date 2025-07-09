# Plataforma Encuentro - API Documentation

This document provides a comprehensive overview of all APIs available in the Plataforma Encuentro microservices architecture.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Gateway Endpoints](#api-gateway-endpoints)
3. [Authentication Service](#authentication-service)
4. [User Service](#user-service)
5. [Events Service](#events-service)
6. [Orders Service](#orders-service)
7. [Realtime Service](#realtime-service)
8. [Common Response Formats](#common-response-formats)
9. [Error Handling](#error-handling)
10. [Usage Examples](#usage-examples)

## Architecture Overview

The platform uses a microservices architecture with the following components:

- **API Gateway** (Port 3000): Entry point for all client requests
- **Auth Service** (Port 3001): User authentication and authorization
- **User Service** (Port 3002): User profile management
- **Events Service** (Port 3003): Event management and ticket categories
- **Orders Service** (Port 3004): Order processing and management
- **Realtime Service** (Port 3005): WebSocket connections and real-time features
- **CockroachDB**: Distributed database for data persistence
- **RabbitMQ**: Message queue for inter-service communication

## API Gateway Endpoints

The API Gateway is the main entry point for all client requests and routes them to appropriate microservices.

### Base URL
```
http://localhost:3000
```

### Health Check

#### GET /
- **Description**: Health check endpoint for the API Gateway
- **Response**: Service status information
- **Example**:
```bash
curl http://localhost:3000/
```
```json
{
  "message": "API Gateway is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "auth": "connected",
    "user": "connected",
    "events": "connected",
    "orders": "connected",
    "realtime": "connected"
  }
}
```

### Authentication Endpoints

#### POST /auth/register
- **Description**: Register a new user account
- **Body**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string"
}
```
- **Response**: User creation confirmation and JWT token
- **Example**:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

#### POST /auth/login
- **Description**: Authenticate user and receive JWT token
- **Body**:
```json
{
  "username": "string",
  "password": "string"
}
```
- **Response**: JWT token and user information
- **Example**:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "securepassword"
  }'
```

#### POST /auth/validate-token
- **Description**: Validate JWT token
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Token validation result
- **Example**:
```bash
curl -X POST http://localhost:3000/auth/validate-token \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### User Management Endpoints

#### GET /user/profile/:id
- **Description**: Get user profile by ID
- **Headers**: `Authorization: Bearer {token}`
- **Parameters**: `id` (string) - User ID
- **Response**: User profile information
- **Example**:
```bash
curl http://localhost:3000/user/profile/123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### GET /user/by-username/:username
- **Description**: Get user profile by username
- **Headers**: `Authorization: Bearer {token}`
- **Parameters**: `username` (string) - Username
- **Response**: User profile information
- **Example**:
```bash
curl http://localhost:3000/user/by-username/johndoe \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### GET /user/all
- **Description**: Get all users (admin only)
- **Headers**: `Authorization: Bearer {token}`
- **Response**: List of all users
- **Example**:
```bash
curl http://localhost:3000/user/all \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Events Management Endpoints

#### GET /events
- **Description**: Get all events with optional filtering
- **Query Parameters**:
  - `status` (optional): Filter by event status
  - `startDate` (optional): Filter events after this date
  - `endDate` (optional): Filter events before this date
- **Response**: List of events
- **Example**:
```bash
curl "http://localhost:3000/events?status=active&startDate=2024-01-01"
```

#### GET /events/:id
- **Description**: Get event details by ID
- **Parameters**: `id` (string) - Event ID
- **Response**: Event details with categories and availability
- **Example**:
```bash
curl http://localhost:3000/events/123
```

#### POST /events
- **Description**: Create a new event (admin only)
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "title": "string",
  "description": "string",
  "startDate": "2024-12-31T20:00:00.000Z",
  "endDate": "2024-12-31T23:00:00.000Z",
  "location": "string",
  "maxCapacity": 1000,
  "status": "active"
}
```
- **Response**: Created event information
- **Example**:
```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "title": "New Year Concert",
    "description": "Celebrate the new year with live music",
    "startDate": "2024-12-31T20:00:00.000Z",
    "endDate": "2024-12-31T23:00:00.000Z",
    "location": "Main Concert Hall",
    "maxCapacity": 1000,
    "status": "active"
  }'
```

#### PUT /events/:id
- **Description**: Update an existing event (admin only)
- **Headers**: `Authorization: Bearer {token}`
- **Parameters**: `id` (string) - Event ID
- **Body**: Event update data (same structure as create)
- **Response**: Updated event information
- **Example**:
```bash
curl -X PUT http://localhost:3000/events/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "title": "Updated Event Title",
    "description": "Updated description"
  }'
```

#### DELETE /events/:id
- **Description**: Delete an event (admin only)
- **Headers**: `Authorization: Bearer {token}`
- **Parameters**: `id` (string) - Event ID
- **Response**: Deletion confirmation
- **Example**:
```bash
curl -X DELETE http://localhost:3000/events/123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### GET /events/:eventId/categories
- **Description**: Get ticket categories for an event
- **Parameters**: `eventId` (string) - Event ID
- **Response**: List of ticket categories with prices and availability
- **Example**:
```bash
curl http://localhost:3000/events/123/categories
```

#### POST /events/:eventId/categories
- **Description**: Create a new ticket category for an event (admin only)
- **Headers**: `Authorization: Bearer {token}`
- **Parameters**: `eventId` (string) - Event ID
- **Body**:
```json
{
  "name": "VIP",
  "description": "VIP seating with premium amenities",
  "price": 150.00,
  "capacity": 100,
  "availableTickets": 100
}
```
- **Response**: Created category information
- **Example**:
```bash
curl -X POST http://localhost:3000/events/123/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "VIP",
    "description": "VIP seating with premium amenities",
    "price": 150.00,
    "capacity": 100,
    "availableTickets": 100
  }'
```

#### GET /events/:eventId/availability
- **Description**: Get real-time ticket availability for an event
- **Parameters**: `eventId` (string) - Event ID
- **Response**: Current availability for all categories
- **Example**:
```bash
curl http://localhost:3000/events/123/availability
```

### Orders Management Endpoints

#### GET /orders
- **Description**: Get all orders for the authenticated user
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**:
  - `status` (optional): Filter by order status
  - `eventId` (optional): Filter by event ID
- **Response**: List of user's orders
- **Example**:
```bash
curl "http://localhost:3000/orders?status=completed" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### GET /orders/:id
- **Description**: Get specific order details
- **Headers**: `Authorization: Bearer {token}`
- **Parameters**: `id` (string) - Order ID
- **Response**: Order details
- **Example**:
```bash
curl http://localhost:3000/orders/order_123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### POST /orders
- **Description**: Create a new order
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "eventId": "123",
  "categoryId": "456",
  "quantity": 2,
  "lockId": "lock_789"
}
```
- **Response**: Created order information
- **Example**:
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "eventId": "123",
    "categoryId": "456",
    "quantity": 2,
    "lockId": "lock_789"
  }'
```

#### PUT /orders/:id/confirm
- **Description**: Confirm a pending order (complete payment)
- **Headers**: `Authorization: Bearer {token}`
- **Parameters**: `id` (string) - Order ID
- **Response**: Order confirmation details
- **Example**:
```bash
curl -X PUT http://localhost:3000/orders/order_123/confirm \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### PUT /orders/:id/cancel
- **Description**: Cancel an order
- **Headers**: `Authorization: Bearer {token}`
- **Parameters**: `id` (string) - Order ID
- **Response**: Cancellation confirmation
- **Example**:
```bash
curl -X PUT http://localhost:3000/orders/order_123/cancel \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### GET /orders/health
- **Description**: Health check for orders service
- **Response**: Service health status
- **Example**:
```bash
curl http://localhost:3000/orders/health
```

#### GET /orders/sample-data
- **Description**: Create sample orders for testing (development only)
- **Response**: Created sample data
- **Example**:
```bash
curl http://localhost:3000/orders/sample-data
```

## Authentication Service

The Auth Service handles user authentication and JWT token management.

### Message Patterns (Internal RabbitMQ)

#### `user-register`
- **Description**: Register a new user
- **Payload**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string"
}
```

#### `user-login`
- **Description**: Authenticate user credentials
- **Payload**:
```json
{
  "username": "string",
  "password": "string"
}
```

#### `validate-token`
- **Description**: Validate JWT token
- **Payload**:
```json
{
  "token": "string"
}
```

## User Service

The User Service manages user profiles and information.

### Message Patterns (Internal RabbitMQ)

#### `get-user-profile`
- **Description**: Get user profile by user ID
- **Payload**: `userId` (string)

#### `get-user-by-username`
- **Description**: Get user profile by username
- **Payload**: `username` (string)

#### `get-all-users`
- **Description**: Get all users in the system
- **Payload**: None

## Events Service

The Events Service manages events, ticket categories, and availability.

### Message Patterns (Internal RabbitMQ)

#### `get-events`
- **Description**: Get all events with optional filtering
- **Payload**:
```json
{
  "status": "string (optional)",
  "startDate": "string (optional)",
  "endDate": "string (optional)"
}
```

#### `get-event-by-id`
- **Description**: Get event details by ID
- **Payload**: `eventId` (string)

#### `create-event`
- **Description**: Create a new event
- **Payload**: Event creation data

#### `update-event`
- **Description**: Update an existing event
- **Payload**: Event update data with eventId

#### `delete-event`
- **Description**: Delete an event
- **Payload**: `eventId` (string)

#### `get-event-categories`
- **Description**: Get ticket categories for an event
- **Payload**: `eventId` (string)

#### `create-event-category`
- **Description**: Create a new ticket category
- **Payload**: Category creation data

#### `get-event-availability`
- **Description**: Get real-time availability for an event
- **Payload**: `eventId` (string)

#### `reserve-tickets`
- **Description**: Reserve tickets (temporary lock)
- **Payload**:
```json
{
  "eventId": "string",
  "categoryId": "string",
  "quantity": "number",
  "userId": "string"
}
```

#### `release-tickets`
- **Description**: Release reserved tickets
- **Payload**:
```json
{
  "eventId": "string",
  "categoryId": "string",
  "quantity": "number",
  "userId": "string"
}
```

## Orders Service

The Orders Service handles order creation, management, and payment processing.

### Message Patterns (Internal RabbitMQ)

#### `get-orders`
- **Description**: Get orders for a user
- **Payload**:
```json
{
  "userId": "string",
  "status": "string (optional)",
  "eventId": "string (optional)"
}
```

#### `get-order-by-id`
- **Description**: Get specific order details
- **Payload**:
```json
{
  "orderId": "string",
  "userId": "string"
}
```

#### `create-order`
- **Description**: Create a new order
- **Payload**:
```json
{
  "userId": "string",
  "eventId": "string",
  "categoryId": "string",
  "quantity": "number",
  "lockId": "string"
}
```

#### `confirm-order`
- **Description**: Confirm and complete an order
- **Payload**:
```json
{
  "orderId": "string",
  "userId": "string"
}
```

#### `cancel-order`
- **Description**: Cancel an order
- **Payload**:
```json
{
  "orderId": "string",
  "userId": "string"
}
```

## Realtime Service

The Realtime Service provides WebSocket connections for real-time features like ticket locking and availability updates.

### WebSocket Connection

#### Connection URL
```
ws://localhost:3005/realtime
```

#### Connection Parameters
- **Query Parameters**:
  - `userId`: User ID for authentication
  - `token`: JWT token (optional, for future authentication)

#### Connection Example
```javascript
const socket = io('http://localhost:3005/realtime', {
  query: {
    userId: '123',
    token: 'jwt_token_here'
  }
});
```

### WebSocket Events

#### Client → Server Events

##### `join-event-room`
- **Description**: Join a specific event room for real-time updates
- **Payload**:
```json
{
  "userId": "number",
  "eventId": "number"
}
```

##### `leave-event-room`
- **Description**: Leave an event room
- **Payload**:
```json
{
  "eventId": "number"
}
```

##### `lock-tickets`
- **Description**: Lock tickets temporarily for purchase
- **Payload**:
```json
{
  "userId": "number",
  "eventId": "number",
  "categoryId": "number",
  "quantity": "number"
}
```

##### `unlock-tickets`
- **Description**: Release locked tickets
- **Payload**:
```json
{
  "userId": "number",
  "eventId": "number",
  "categoryId": "number",
  "quantity": "number"
}
```

##### `get-my-locks`
- **Description**: Get current user's locked tickets
- **Payload**: None

##### `heartbeat`
- **Description**: Keep connection alive
- **Payload**: None

#### Server → Client Events

##### `connected`
- **Description**: Connection confirmation
- **Payload**:
```json
{
  "success": true,
  "sessionId": "string",
  "message": "string"
}
```

##### `joined-event-room`
- **Description**: Event room join confirmation
- **Payload**:
```json
{
  "success": true,
  "eventId": "number",
  "message": "string"
}
```

##### `lock-tickets-response`
- **Description**: Response to ticket lock request
- **Payload**:
```json
{
  "success": "boolean",
  "lockId": "string (if successful)",
  "message": "string",
  "expiresAt": "Date (if successful)"
}
```

##### `unlock-tickets-response`
- **Description**: Response to ticket unlock request
- **Payload**:
```json
{
  "success": "boolean",
  "message": "string"
}
```

##### `availability-update`
- **Description**: Real-time availability updates
- **Payload**:
```json
{
  "eventId": "number",
  "categoryId": "number",
  "availableTickets": "number",
  "lockedTickets": "number"
}
```

##### `my-locks-response`
- **Description**: Response with user's current locks
- **Payload**:
```json
{
  "locks": [
    {
      "lockId": "string",
      "eventId": "number",
      "categoryId": "number",
      "quantity": "number",
      "expiresAt": "Date"
    }
  ]
}
```

##### `order-update`
- **Description**: Order status updates
- **Payload**:
```json
{
  "orderId": "string",
  "status": "string",
  "eventId": "number",
  "message": "string"
}
```

### REST Endpoints

#### GET /
- **Description**: Basic service information
- **Response**: Service status

#### GET /stats
- **Description**: Real-time service statistics
- **Response**: Connection stats and active locks

### Message Patterns (Internal RabbitMQ)

#### `confirm-ticket-lock`
- **Description**: Confirm a ticket lock from external service
- **Payload**:
```json
{
  "lockId": "string"
}
```

#### `confirm-lock`
- **Description**: Confirm a lock with user information
- **Payload**:
```json
{
  "lockId": "string",
  "userId": "number"
}
```

#### `release-ticket-lock`
- **Description**: Release a ticket lock from external service
- **Payload**:
```json
{
  "lockId": "string"
}
```

#### `order-completed`
- **Description**: Handle order completion event
- **Payload**:
```json
{
  "orderId": "number",
  "eventId": "number",
  "categoryId": "number",
  "quantity": "number",
  "userId": "number"
}
```

#### `order-cancelled`
- **Description**: Handle order cancellation event
- **Payload**:
```json
{
  "orderId": "number",
  "eventId": "number",
  "categoryId": "number",
  "quantity": "number",
  "userId": "number"
}
```

#### `get-realtime-stats`
- **Description**: Get real-time service statistics
- **Payload**: None

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Handling

### HTTP Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required or invalid
- **403 Forbidden**: Access denied
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., duplicate username)
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Service temporarily unavailable

### Common Error Codes

- `INVALID_CREDENTIALS`: Wrong username or password
- `TOKEN_EXPIRED`: JWT token has expired
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `VALIDATION_ERROR`: Request validation failed
- `INSUFFICIENT_TICKETS`: Not enough tickets available
- `LOCK_EXPIRED`: Ticket lock has expired
- `ORDER_NOT_FOUND`: Order doesn't exist or doesn't belong to user
- `EVENT_NOT_ACTIVE`: Event is not currently active for booking

## Usage Examples

### Complete User Journey Example

#### 1. User Registration
```bash
# Register a new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_smith",
    "email": "alice@example.com",
    "password": "securepassword123",
    "firstName": "Alice",
    "lastName": "Smith"
  }'
```

#### 2. User Login
```bash
# Login and get JWT token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_smith",
    "password": "securepassword123"
  }'
```

#### 3. Browse Events
```bash
# Get all active events
curl "http://localhost:3000/events?status=active"

# Get specific event details
curl http://localhost:3000/events/123
```

#### 4. Check Ticket Availability
```bash
# Get ticket categories for an event
curl http://localhost:3000/events/123/categories

# Get real-time availability
curl http://localhost:3000/events/123/availability
```

#### 5. Real-time Ticket Locking
```javascript
// Connect to WebSocket
const socket = io('http://localhost:3005/realtime', {
  query: { userId: '456' }
});

// Join event room
socket.emit('join-event-room', {
  userId: 456,
  eventId: 123
});

// Lock tickets
socket.emit('lock-tickets', {
  userId: 456,
  eventId: 123,
  categoryId: 789,
  quantity: 2
});

// Listen for lock response
socket.on('lock-tickets-response', (response) => {
  if (response.success) {
    console.log('Tickets locked:', response.lockId);
    // Proceed to create order
  }
});
```

#### 6. Create Order
```bash
# Create order with locked tickets
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "eventId": "123",
    "categoryId": "789",
    "quantity": 2,
    "lockId": "lock_abc123"
  }'
```

#### 7. Confirm Payment
```bash
# Confirm order (simulate payment completion)
curl -X PUT http://localhost:3000/orders/order_456/confirm \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 8. View Order History
```bash
# Get user's orders
curl http://localhost:3000/orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### WebSocket Integration Example

```javascript
class EventBookingClient {
  constructor(userId, token) {
    this.userId = userId;
    this.token = token;
    this.socket = null;
    this.currentLocks = [];
  }

  connect() {
    this.socket = io('http://localhost:3005/realtime', {
      query: {
        userId: this.userId,
        token: this.token
      }
    });

    this.socket.on('connected', (data) => {
      console.log('Connected to realtime service:', data);
    });

    this.socket.on('availability-update', (update) => {
      console.log('Availability updated:', update);
      // Update UI with new availability
    });

    this.socket.on('lock-tickets-response', (response) => {
      if (response.success) {
        this.currentLocks.push({
          lockId: response.lockId,
          expiresAt: response.expiresAt
        });
        // Proceed with order creation
        this.createOrder(response.lockId);
      } else {
        console.error('Failed to lock tickets:', response.message);
      }
    });

    this.socket.on('order-update', (update) => {
      console.log('Order status update:', update);
      // Update UI with order status
    });
  }

  joinEventRoom(eventId) {
    this.socket.emit('join-event-room', {
      userId: this.userId,
      eventId: eventId
    });
  }

  lockTickets(eventId, categoryId, quantity) {
    this.socket.emit('lock-tickets', {
      userId: this.userId,
      eventId: eventId,
      categoryId: categoryId,
      quantity: quantity
    });
  }

  async createOrder(lockId) {
    try {
      const response = await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          eventId: this.currentEventId,
          categoryId: this.currentCategoryId,
          quantity: this.currentQuantity,
          lockId: lockId
        })
      });

      const order = await response.json();
      console.log('Order created:', order);
      return order;
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Usage
const client = new EventBookingClient(456, 'jwt_token_here');
client.connect();
client.joinEventRoom(123);
client.lockTickets(123, 789, 2);
```

### Admin Operations Example

```bash
# Create a new event (admin only)
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin_jwt_token" \
  -d '{
    "title": "Summer Music Festival",
    "description": "A three-day outdoor music festival featuring top artists",
    "startDate": "2024-07-15T18:00:00.000Z",
    "endDate": "2024-07-17T23:00:00.000Z",
    "location": "Central Park",
    "maxCapacity": 5000,
    "status": "active"
  }'

# Add ticket categories
curl -X POST http://localhost:3000/events/123/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin_jwt_token" \
  -d '{
    "name": "General Admission",
    "description": "Standing room access to main stage area",
    "price": 75.00,
    "capacity": 3000,
    "availableTickets": 3000
  }'

curl -X POST http://localhost:3000/events/123/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin_jwt_token" \
  -d '{
    "name": "VIP",
    "description": "Premium viewing area with complimentary drinks",
    "price": 200.00,
    "capacity": 500,
    "availableTickets": 500
  }'

# Get all users (admin only)
curl http://localhost:3000/user/all \
  -H "Authorization: Bearer admin_jwt_token"
```

## Development and Testing

### Health Checks

All services provide health check endpoints for monitoring:

```bash
# Check all services via API Gateway
curl http://localhost:3000/

# Individual service health checks
curl http://localhost:3000/orders/health
curl http://localhost:3005/stats
```

### Sample Data Creation

For development and testing purposes:

```bash
# Create sample orders
curl http://localhost:3000/orders/sample-data

# Create sample events (if endpoint exists)
curl http://localhost:3000/events/sample-data
```

### Database Inspection (CockroachDB)

```bash
# Check database connection and data
npm run check-cockroach-data

# Reset database schema
npm run reset-cockroach-schema

# Connect to CockroachDB CLI
docker exec -it cockroach1 ./cockroach sql --insecure --host=localhost:26257
```

## Security Considerations

### Authentication
- All authenticated endpoints require a valid JWT token in the Authorization header
- Tokens should be included as: `Authorization: Bearer {token}`
- Tokens have expiration times and should be refreshed as needed

### Authorization
- Admin-only endpoints are protected with role-based access control
- Users can only access their own orders and profile data
- WebSocket connections require user authentication

### Rate Limiting
- API endpoints may have rate limiting in production
- WebSocket connections are limited per user

### CORS Configuration
- CORS is configured for development (allow all origins)
- Production should use specific allowed origins

This documentation covers all available APIs in the Plataforma Encuentro system. For the most up-to-date information, refer to the individual service code and OpenAPI specifications if available.

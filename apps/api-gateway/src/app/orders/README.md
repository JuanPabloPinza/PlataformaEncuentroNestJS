# Orders API Documentation

## Overview
The Orders API handles ticket purchases and order management through RabbitMQ messaging. It automatically reserves tickets in the events-service when orders are created.

## Architecture
- **Transport**: RabbitMQ (Message Queue)
- **Queue**: `orders_queue`
- **Database**: PostgreSQL (`orders_db`)
- **Authentication**: Required for all endpoints

## API Endpoints

### 1. Create Order 🔒
**POST** `/api/orders`

Creates a new order and reserves tickets automatically.

**Request Body:**
```json
{
  "eventId": 1,
  "categoryId": 2,
  "quantity": 2,
  "notes": "Birthday gift tickets"
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 123,
  "eventId": 1,
  "categoryId": 2,
  "quantity": 2,
  "unitPrice": 199.99,
  "totalPrice": 399.98,
  "status": "confirmed",
  "eventName": "Summer Music Festival 2025",
  "categoryName": "Gold",
  "notes": "Birthday gift tickets",
  "createdAt": "2025-07-06T10:00:00Z",
  "updatedAt": "2025-07-06T10:00:00Z"
}
```

### 2. Get My Orders 🔒
**GET** `/api/orders`

Retrieves all orders for the authenticated user.

### 3. Get Order by ID 🔒
**GET** `/api/orders/{id}`

Retrieves a specific order by its ID.

### 4. Get All Orders 🔒
**GET** `/api/orders/all`

Retrieves all orders (admin functionality).

### 5. Get Orders by Event 🔒
**GET** `/api/orders/event/{eventId}`

Retrieves all orders for a specific event.

### 6. Cancel Order 🔒
**POST** `/api/orders/{id}/cancel`

Cancels an order and releases the reserved tickets.

## Order Workflow

1. **Order Creation**:
   - User creates an order
   - System validates event and ticket availability
   - Tickets are reserved in events-service
   - Order status is set to "confirmed"

2. **Order Cancellation**:
   - User cancels the order
   - System releases reserved tickets
   - Order status is set to "cancelled"

## Order Status Flow

```
PENDING → CONFIRMED → COMPLETED
    ↓
CANCELLED
```

- **PENDING**: Order created but not yet confirmed
- **CONFIRMED**: Order confirmed and tickets reserved
- **COMPLETED**: Order fulfilled (tickets delivered)
- **CANCELLED**: Order cancelled and tickets released

## Error Handling

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Not enough tickets available. Only 5 tickets left"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Event not found"
}
```

## RabbitMQ Integration

The orders-service uses RabbitMQ for asynchronous communication:

### Queue Configuration
```typescript
{
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://admin:admin@127.0.0.1:5672'],
    queue: 'orders_queue',
    queueOptions: {
      durable: true,
    },
  },
}
```

### Message Patterns
- `create-order`
- `get-order-by-id`
- `get-orders-by-user`
- `get-orders-by-event`
- `get-all-orders`
- `cancel-order`

## Database Schema

### Orders Table
```sql
CREATE TABLE order (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    event_name VARCHAR(255) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Testing Examples

### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "eventId": 1,
    "categoryId": 2,
    "quantity": 2,
    "notes": "Anniversary celebration"
  }'
```

### Get My Orders
```bash
curl -X GET http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Cancel Order
```bash
curl -X POST http://localhost:3000/api/orders/1/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Integration with Events Service

The orders-service communicates with the events-service to:
1. Validate event and ticket category existence
2. Check ticket availability
3. Reserve tickets when orders are created
4. Release tickets when orders are cancelled

This ensures real-time ticket availability and prevents overbooking.

## Setup Requirements

1. **RabbitMQ Server**: Must be running on `127.0.0.1:5672`
2. **PostgreSQL**: Database `orders_db` must exist
3. **Events Service**: Must be running for ticket validation
4. **Auth Service**: Must be running for user authentication

## Production Considerations

1. **Error Handling**: Implement comprehensive error handling for RabbitMQ failures
2. **Transactions**: Use database transactions for order creation
3. **Dead Letter Queues**: Implement for failed message processing
4. **Monitoring**: Add monitoring for queue depth and processing times
5. **Retry Logic**: Implement retry mechanisms for failed operations

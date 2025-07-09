# Quick Start Guide: Testing the Complete Ticketing System

## Prerequisites

1. **PostgreSQL Database**
   - Install PostgreSQL (if not already installed)
   - Create databases: `events_db`, `orders_db`, `user_db`
   - Update database credentials in each service if needed

2. **RabbitMQ**
   - Install RabbitMQ (if not already installed)
   - Start RabbitMQ server
   - Default credentials: `admin:admin`

## Starting All Services

### Method 1: Using Nx (Recommended)

Open 4 terminals and run each service:

```bash
# Terminal 1: API Gateway
cd d:\ReposGitHub\Centralized-Auth-NestJS-Microservices
nx serve api-gateway

# Terminal 2: Events Service
nx serve events-service

# Terminal 3: Orders Service  
nx serve orders-service

# Terminal 4: Realtime Service
nx serve realtime-service
```

### Method 2: Using npm scripts

```bash
# Terminal 1
npm run serve:api-gateway

# Terminal 2
npm run serve:events-service

# Terminal 3
npm run serve:orders-service

# Terminal 4
npm run serve:realtime-service
```

## Service Endpoints

- **API Gateway**: http://localhost:3000
- **Events Service**: http://localhost:8879
- **Orders Service**: http://localhost:8878 (RabbitMQ)
- **Realtime Service**: http://localhost:8880 (WebSocket: ws://localhost:8880/realtime)
- **Auth Service**: http://localhost:8877

## Testing the Integration

### Step 1: Create Test Data

1. **Create a User** (via API Gateway):
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "customer"
  }'
```

2. **Login to get JWT**:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

3. **Create an Event** (requires organizer role):
```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "eventName": "Test Concert",
    "description": "A test concert event",
    "eventDate": "2025-08-15T19:00:00Z",
    "location": "Test Venue",
    "ticketCategories": [
      {
        "categoryName": "VIP",
        "price": 150.00,
        "totalSeats": 50
      },
      {
        "categoryName": "General",
        "price": 75.00,
        "totalSeats": 200
      }
    ]
  }'
```

### Step 2: Test Realtime Integration

1. **Open the Test Client**:
   - Navigate to: `apps/realtime-service/examples/test-client.html`
   - Open in your browser

2. **Test Complete Order Flow**:
   - Connect to realtime service
   - Join event room (use event ID from step 1)
   - Click "Test Complete Order Flow"
   - Watch the real-time updates

### Step 3: Manual API Testing

1. **Lock Tickets via WebSocket**:
   - Use the test client to lock tickets
   - Note the lock ID returned

2. **Create Order with Lock**:
```bash
curl -X POST http://localhost:3000/orders/with-lock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "eventId": 1,
    "categoryId": 1,
    "quantity": 2,
    "lockId": "YOUR_LOCK_ID",
    "notes": "Test order"
  }'
```

3. **Check Real-time Updates**:
   - Watch the test client for availability updates
   - Verify order completion notifications

## Troubleshooting

### Common Issues

1. **Services won't start**:
   - Check if ports are available
   - Ensure PostgreSQL and RabbitMQ are running
   - Check database credentials

2. **RabbitMQ connection errors**:
   - Verify RabbitMQ is running: `sudo systemctl status rabbitmq-server`
   - Check credentials in service configurations
   - Restart RabbitMQ if needed

3. **Database connection errors**:
   - Verify PostgreSQL is running
   - Check database names exist
   - Verify credentials in TypeORM configuration

4. **WebSocket connection fails**:
   - Check if realtime-service is running on port 8880
   - Verify CORS configuration
   - Check browser console for errors

### Debug Commands

```bash
# Check service health
curl http://localhost:3000/
curl http://localhost:8879/
curl http://localhost:8880/
curl http://localhost:8880/stats

# Check RabbitMQ
curl -u admin:admin http://localhost:15672/api/overview

# Check PostgreSQL connections
psql -h localhost -U postgres -l
```

### Logs to Monitor

- **API Gateway**: Authentication and routing logs
- **Events Service**: Event and ticket management logs
- **Orders Service**: Order creation and RabbitMQ communication
- **Realtime Service**: WebSocket connections and lock management

## Success Indicators

✅ All services start without errors
✅ WebSocket connection established in test client
✅ Can join event rooms and receive updates
✅ Ticket locking works and shows availability changes
✅ Order creation with locks completes successfully
✅ Real-time notifications are received
✅ Order cancellation updates availability

## Next Steps

After successful testing:

1. **Production Setup**:
   - Configure JWT validation in WebSocket handshake
   - Set up Redis for distributed lock storage
   - Configure proper CORS and security settings

2. **Frontend Integration**:
   - Integrate WebSocket client into your frontend
   - Handle lock timeouts and reconnections
   - Implement proper error handling

3. **Monitoring**:
   - Set up logging and monitoring
   - Add metrics for lock success rates
   - Monitor WebSocket connection counts

## Support

If you encounter issues:
1. Check the individual service README files
2. Review the ERROR_HANDLING.md and AUTHORIZATION.md documentation
3. Check the INTEGRATION.md for detailed flow explanations

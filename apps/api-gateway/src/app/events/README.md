# Events API Documentation

## Overview
The Events API provides endpoints for managing events and ticket reservations through the API Gateway. All endpoints are prefixed with `/api/events`.

## Authentication
- 🔒 **Protected endpoints** require authentication (JWT token in Authorization header)
- 🔓 **Public endpoints** can be accessed without authentication

## Endpoints

### 1. Create Event 🔒
**POST** `/api/events`

Creates a new event with ticket categories.

**Request Body:**
```json
{
  "eventName": "Summer Music Festival 2025",
  "eventCategory": "Music",
  "description": "A spectacular outdoor music festival",
  "eventDate": "2025-08-15T18:00:00Z",
  "location": "Central Park, New York",
  "ticketCategories": [
    {
      "categoryName": "Platinum",
      "price": 299.99,
      "totalSeats": 100,
      "description": "Premium experience with backstage access"
    },
    {
      "categoryName": "Gold",
      "price": 199.99,
      "totalSeats": 500,
      "description": "Excellent view with priority seating"
    },
    {
      "categoryName": "Silver",
      "price": 99.99,
      "totalSeats": 1000,
      "description": "Great view with comfortable seating"
    }
  ]
}
```

### 2. Get All Events 🔓
**GET** `/api/events`

Retrieves all active events with their ticket categories.

**Response:**
```json
[
  {
    "idEvent": 1,
    "eventName": "Summer Music Festival 2025",
    "eventCategory": "Music",
    "description": "A spectacular outdoor music festival",
    "eventDate": "2025-08-15T18:00:00Z",
    "location": "Central Park, New York",
    "isActive": true,
    "ticketCategories": [
      {
        "id": 1,
        "categoryName": "Platinum",
        "price": 299.99,
        "totalSeats": 100,
        "reservedSeats": 25,
        "availableSeats": 75,
        "description": "Premium experience"
      }
    ]
  }
]
```

### 3. Get Upcoming Events 🔓
**GET** `/api/events/upcoming`

Retrieves upcoming events sorted by date.

### 4. Get Events by Category 🔓
**GET** `/api/events/category/{category}`

Retrieves events filtered by category.

**Example:** `/api/events/category/Music`

### 5. Get Event by ID 🔓
**GET** `/api/events/{id}`

Retrieves a specific event by its ID.

**Example:** `/api/events/1`

### 6. Update Event 🔒
**PUT** `/api/events/{id}`

Updates an existing event.

**Request Body:**
```json
{
  "eventName": "Updated Event Name",
  "description": "Updated description",
  "isActive": true
}
```

### 7. Delete Event 🔒
**DELETE** `/api/events/{id}`

Soft deletes an event (sets isActive to false).

### 8. Get Ticket Categories 🔓
**GET** `/api/events/{id}/tickets`

Retrieves ticket categories for a specific event.

**Example:** `/api/events/1/tickets`

### 9. Reserve Tickets 🔒
**POST** `/api/events/tickets/reserve`

Reserves tickets for a specific event and category.

**Request Body:**
```json
{
  "eventId": 1,
  "categoryId": 2,
  "quantity": 2
}
```

### 10. Release Tickets 🔒
**POST** `/api/events/tickets/release`

Releases previously reserved tickets.

**Request Body:**
```json
{
  "categoryId": 2,
  "quantity": 1
}
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Not enough seats available. Only 5 seats left"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Event with ID 1 not found"
}
```

## Usage Examples

### Creating an Event with cURL
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "eventName": "Rock Concert 2025",
    "eventCategory": "Music",
    "description": "Amazing rock concert",
    "eventDate": "2025-09-20T20:00:00Z",
    "location": "Madison Square Garden",
    "ticketCategories": [
      {
        "categoryName": "VIP",
        "price": 150.00,
        "totalSeats": 50,
        "description": "VIP experience"
      },
      {
        "categoryName": "General",
        "price": 50.00,
        "totalSeats": 1000,
        "description": "General admission"
      }
    ]
  }'
```

### Reserving Tickets with cURL
```bash
curl -X POST http://localhost:3000/api/events/tickets/reserve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "eventId": 1,
    "categoryId": 1,
    "quantity": 2
  }'
```

### Getting All Events with cURL
```bash
curl -X GET http://localhost:3000/api/events
```

## Notes
- All dates should be in ISO 8601 format
- Prices are in decimal format (e.g., 299.99)
- Ticket quantities are integers
- Available seats are calculated automatically (totalSeats - reservedSeats)
- Events are soft-deleted (isActive = false) rather than permanently removed

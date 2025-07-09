# Events Authorization System

## Overview
The events-service now implements role-based access control (RBAC) with ownership-based permissions for event management.

## Authorization Rules

### 1. Event Creation
- **Who can create**: Only users with `ORGANIZER` role
- **Who cannot create**: Users with `ASSISTANT` role
- **Implementation**: Checks `userContext.role` in `createEvent` method

### 2. Event Editing
- **Who can edit**: Only the user who created the event (event owner)
- **Implementation**: Checks `event.createdBy === userContext.userId`

### 3. Event Deletion
- **Who can delete**: Only the user who created the event (event owner) 
- **Implementation**: Checks `event.createdBy === userContext.userId`

### 4. Event Viewing
- **Who can view**: Everyone (no restrictions)
- **Public endpoints**: GET operations remain unrestricted

## Database Changes

### Event Entity
Added `createdBy` field to track event ownership:

```sql
ALTER TABLE event ADD COLUMN created_by INTEGER NOT NULL;
```

**Note**: Existing events in the database will need the `created_by` field populated. You can set a default organizer user ID for existing events.

## API Changes

### Request Format
All create/update/delete operations now require user context:

**Before:**
```json
POST /api/events
{
  "eventName": "My Event",
  "eventCategory": "Music",
  "description": "Great event"
}
```

**After:**
The API Gateway automatically injects user context from the JWT token:
```json
// Internal payload sent to events-service
{
  "eventName": "My Event", 
  "eventCategory": "Music",
  "description": "Great event",
  "userContext": {
    "userId": 123,
    "role": "organizer"
  }
}
```

### Error Responses

**403 Forbidden - Role Access Denied:**
```json
{
  "statusCode": 403,
  "message": "Only organizers can create events"
}
```

**403 Forbidden - Ownership Access Denied:**
```json
{
  "statusCode": 403,
  "message": "You can only edit events that you created"
}
```

## Implementation Details

### API Gateway Changes
- Events controller now extracts user info from JWT token
- Passes `userContext` to events-service for all protected operations
- Uses `@Request() req` to access `req.user` set by AuthGuard

### Events Service Changes
1. **DTOs Updated**: Added `UserContextDto` and updated `CreateEventDto`/`UpdateEventDto`
2. **Authorization Logic**: Added role and ownership checks
3. **Entity Updated**: Added `createdBy` field to Event entity
4. **Repository Updated**: Modified create/update methods to handle user context
5. **Logging Added**: Comprehensive logging for debugging authorization

### RabbitMQ Message Patterns
Message patterns remain the same, but payloads now include user context:

- `create-event`: Includes `userContext`
- `update-event`: Includes `userContext` in `updateEventDto`
- `delete-event`: Includes `userContext` as separate field

## Testing Authorization

### Create Event (Success - Organizer)
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ORGANIZER_JWT_TOKEN" \
  -d '{
    "eventName": "New Event",
    "eventCategory": "Music",
    "description": "Test event"
  }'
```

### Create Event (Fail - Assistant)
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ASSISTANT_JWT_TOKEN" \
  -d '{
    "eventName": "New Event",
    "eventCategory": "Music", 
    "description": "Test event"
  }'
# Expected: 403 Forbidden
```

### Update Event (Success - Owner)
```bash
curl -X PUT http://localhost:3000/api/events/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer OWNER_JWT_TOKEN" \
  -d '{
    "eventName": "Updated Event Name"
  }'
```

### Update Event (Fail - Non-Owner)
```bash
curl -X PUT http://localhost:3000/api/events/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer OTHER_USER_JWT_TOKEN" \
  -d '{
    "eventName": "Updated Event Name"
  }'
# Expected: 403 Forbidden
```

## Production Considerations

1. **Database Migration**: Update existing events with a default `created_by` value
2. **Audit Logging**: Consider adding audit logs for all event modifications
3. **Role Management**: Ensure proper role assignment in user management system
4. **Backup Strategy**: Consider event ownership in backup/restore procedures

## Security Benefits

1. **Principle of Least Privilege**: Only organizers can create events
2. **Data Isolation**: Users can only modify their own events
3. **Audit Trail**: Track who created/modified each event
4. **Role-Based Security**: Clear separation between assistant and organizer capabilities

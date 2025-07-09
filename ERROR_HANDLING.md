# Enhanced Error Handling System

## Overview
The system now has comprehensive error handling that provides detailed error messages instead of generic 500 Internal Server Errors. This applies to all microservices communication through the API Gateway.

## Architecture

### API Gateway Error Handling
- **RpcExceptionInterceptor**: Catches and transforms errors from microservices
- **Global Interceptor**: Applied to all API Gateway controllers
- **Structured Responses**: Returns proper HTTP status codes with detailed messages

### Microservice Error Handling  
- **RpcExceptionFilter**: Catches exceptions in each microservice
- **Error Transformation**: Converts HTTP exceptions to RPC exceptions
- **Consistent Format**: All services use the same error structure

## Error Response Format

### Before (Generic 500)
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

### After (Detailed Errors)
```json
{
  "statusCode": 403,
  "message": "Only organizers can create events",
  "error": "Forbidden"
}
```

## Supported Error Types

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Not enough tickets available. Only 5 tickets left",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid Token!",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "You can only edit events that you created",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Event with ID 999 not found",
  "error": "Not Found"
}
```

### 503 Service Unavailable
```json
{
  "statusCode": 503,
  "message": "Service temporarily unavailable",
  "error": "Service Unavailable"
}
```

### 408 Request Timeout
```json
{
  "statusCode": 408,
  "message": "Request timeout",
  "error": "Request Timeout"
}
```

## Error Flow

1. **Microservice Exception**: Service throws specific exception (e.g., `ForbiddenException`)
2. **RpcExceptionFilter**: Catches and formats the exception
3. **RPC Transport**: Error sent back to API Gateway via RabbitMQ/TCP
4. **RpcExceptionInterceptor**: API Gateway transforms RPC error to HTTP response
5. **Client Response**: Client receives detailed error with proper status code

## Implementation Details

### API Gateway Interceptor
```typescript
// apps/api-gateway/src/interceptors/rpc-exception.interceptor.ts
@Injectable()
export class RpcExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Transform RPC errors to HTTP exceptions
        if (error?.error?.statusCode && error.error.message) {
          throw new HttpException(error.error, error.error.statusCode);
        }
        // Handle other error types...
      })
    );
  }
}
```

### Microservice Filter
```typescript
// apps/*/src/filters/rpc-exception.filter.ts
@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    if (exception instanceof HttpException) {
      // Format HTTP exceptions properly
      const error = {
        statusCode: exception.getStatus(),
        message: exception.getResponse(),
        error: this.getErrorName(exception.getStatus())
      };
      return throwError(() => new RpcException(error));
    }
    // Handle other exception types...
  }
}
```

## Service-Specific Error Examples

### Events Service
- **403**: "Only organizers can create events"
- **403**: "You can only edit events that you created" 
- **404**: "Event with ID {id} not found"
- **404**: "Ticket category with ID {id} not found for this event"

### Orders Service
- **400**: "Not enough tickets available. Only {count} tickets left"
- **404**: "Order with ID {id} not found"
- **400**: "Only confirmed orders can be cancelled"

### Auth Service
- **401**: "Invalid Token!"
- **401**: "missing token!"
- **400**: "Invalid credentials"

### User Service
- **404**: "User with ID {id} not found"
- **409**: "User already exists"

## Logging

Each service now logs errors with structured information:

```
🚨 [Events Service] Exception caught: ForbiddenException: Only organizers can create events
📤 [Events Service] Formatted error response: {
  statusCode: 403,
  message: "Only organizers can create events",
  error: "Forbidden"
}
```

```
🚨 [API Gateway] Caught error: RpcException with structured error
📤 [API Gateway] Forwarding structured error: {
  statusCode: 403,
  message: "Only organizers can create events", 
  error: "Forbidden"
}
```

## Testing Error Scenarios

### Test Authorization Error
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ASSISTANT_JWT_TOKEN" \
  -d '{"eventName": "Test Event"}'

# Expected Response:
# {
#   "statusCode": 403,
#   "message": "Only organizers can create events",
#   "error": "Forbidden"  
# }
```

### Test Not Found Error
```bash
curl -X GET http://localhost:3000/api/events/999

# Expected Response:
# {
#   "statusCode": 404,
#   "message": "Event with ID 999 not found",
#   "error": "Not Found"
# }
```

### Test Validation Error
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VALID_JWT_TOKEN" \
  -d '{"eventId": 1, "categoryId": 999, "quantity": 10}'

# Expected Response:
# {
#   "statusCode": 404,
#   "message": "Ticket category not found",
#   "error": "Not Found"
# }
```

## Benefits

1. **Better Developer Experience**: Clear error messages for debugging
2. **Client-Friendly**: Proper HTTP status codes and descriptive messages  
3. **Consistent Format**: All errors follow the same structure
4. **Detailed Logging**: Comprehensive error tracking in service logs
5. **Production Ready**: Handles connection failures and timeouts gracefully

## Production Considerations

1. **Error Sanitization**: Ensure sensitive information isn't exposed in error messages
2. **Rate Limiting**: Consider implementing rate limiting for error responses
3. **Monitoring**: Set up alerts for high error rates
4. **Documentation**: Keep error message documentation updated for API consumers

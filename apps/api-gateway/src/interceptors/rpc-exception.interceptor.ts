import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable()
export class RpcExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        console.log('🚨 [API Gateway] Caught error:', error);
        
        // Handle RPC exceptions from microservices
        if (error?.error) {
          const rpcError = error.error;
          
          // If it's already a structured error from microservice
          if (rpcError.statusCode && rpcError.message) {
            console.log('📤 [API Gateway] Forwarding structured error:', rpcError);
            throw new HttpException(
              {
                statusCode: rpcError.statusCode,
                message: rpcError.message,
                error: rpcError.error || this.getErrorName(rpcError.statusCode)
              },
              rpcError.statusCode
            );
          }
          
          // If it's a string error message
          if (typeof rpcError === 'string') {
            console.log('📤 [API Gateway] Converting string error:', rpcError);
            throw new HttpException(
              {
                statusCode: HttpStatus.BAD_REQUEST,
                message: rpcError,
                error: 'Bad Request'
              },
              HttpStatus.BAD_REQUEST
            );
          }
        }
        
        // Handle connection errors
        if (error.code === 'ECONNREFUSED' || error.message?.includes('connection')) {
          console.log('📤 [API Gateway] Service unavailable error');
          throw new HttpException(
            {
              statusCode: HttpStatus.SERVICE_UNAVAILABLE,
              message: 'Service temporarily unavailable',
              error: 'Service Unavailable'
            },
            HttpStatus.SERVICE_UNAVAILABLE
          );
        }
        
        // Handle timeout errors
        if (error.name === 'TimeoutError') {
          console.log('📤 [API Gateway] Timeout error');
          throw new HttpException(
            {
              statusCode: HttpStatus.REQUEST_TIMEOUT,
              message: 'Request timeout',
              error: 'Request Timeout'
            },
            HttpStatus.REQUEST_TIMEOUT
          );
        }
        
        // Default fallback
        console.log('📤 [API Gateway] Unhandled error, returning 500:', error);
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal server error',
            error: 'Internal Server Error'
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      })
    );
  }
  
  private getErrorName(statusCode: number): string {
    switch (statusCode) {
      case 400: return 'Bad Request';
      case 401: return 'Unauthorized';
      case 403: return 'Forbidden';
      case 404: return 'Not Found';
      case 409: return 'Conflict';
      case 422: return 'Unprocessable Entity';
      default: return 'Error';
    }
  }
}

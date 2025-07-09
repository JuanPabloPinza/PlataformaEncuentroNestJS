import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    console.log('🚨 [Microservice] Exception caught:', exception);
    
    let error: any;
    
    if (exception instanceof HttpException) {
      // Handle HTTP exceptions (BadRequestException, NotFoundException, etc.)
      const response = exception.getResponse();
      const status = exception.getStatus();
      
      error = {
        statusCode: status,
        message: typeof response === 'string' ? response : (response as any).message,
        error: this.getErrorName(status)
      };
    } else if (exception instanceof RpcException) {
      // Handle RPC exceptions
      const rpcError = exception.getError();
      error = typeof rpcError === 'string' ? { message: rpcError } : rpcError;
    } else if (exception?.code === 'ENOTFOUND' || exception?.code === 'ECONNREFUSED') {
      // Handle database/connection errors
      error = {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database connection error',
        error: 'Service Unavailable'
      };
    } else {
      // Handle generic errors
      error = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception?.message || 'Internal server error',
        error: 'Internal Server Error'
      };
    }
    
    console.log('📤 [Microservice] Formatted error response:', error);
    return throwError(() => new RpcException(error));
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

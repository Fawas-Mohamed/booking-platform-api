import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

/**
 * Wraps every successful controller response in a standard envelope:
 * { success: true, message: string, data: T }
 *
 * Controllers can return { message, data } to customize the message,
 * otherwise a sensible default is used and the raw payload becomes `data`.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        if (result && typeof result === 'object' && 'message' in result && 'data' in result) {
          const { message, data } = result as { message: string; data: T };
          return { success: true, message, data };
        }
        return { success: true, message: 'Request successful', data: result };
      }),
    );
  }
}

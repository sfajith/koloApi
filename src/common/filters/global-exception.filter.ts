import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // 🟣 PRISMA ERRORS
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(
        `Prisma error ${exception.code} on ${request.method} ${request.url}`,
        exception.stack,
      );

      if (exception.code === 'P2002') {
        const field = Array.isArray(exception.meta?.target)
          ? exception.meta.target.join(', ')
          : exception.meta?.target;

        return response.status(HttpStatus.CONFLICT).json({
          success: false,
          message: 'Email already registered',
          error: 'CONFLICT',
        });
      }
    }

    // 🔵 HTTP ERRORS
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      this.logger.error(
        `HTTP Exception ${status} on ${request.method} ${request.url}`,
        exception.stack,
      );

      let message = 'Error';
      let error = 'UNKNOWN_ERROR';

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object') {
        message = (res as any).message || message;
        error = (res as any).error || error;
      }

      return response.status(status).json({
        success: false,
        message,
        error,
      });
    }

    // 🔴 UNKNOWN ERRORS
    this.logger.error(
      `Unknown error on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
}

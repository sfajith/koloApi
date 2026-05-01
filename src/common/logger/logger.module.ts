import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerService } from './logger.service';
import { LoggerInterceptor } from './logger.interceptor';
import { RequestContextService } from '../logger/context/request-context.service';

@Global() // 🔥 CLAVE
@Module({
  providers: [
    LoggerService,
    LoggerInterceptor,
    RequestContextService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
  ],
  exports: [
    LoggerService,
    RequestContextService, // 🔥 CLAVE
  ],
})
export class LoggerModule {}

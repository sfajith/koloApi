import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { RequestContextService } from '../logger/context/request-context.service';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private context: RequestContextService) {}

intercept(contextExec: ExecutionContext, next: CallHandler) {
  const req = contextExec.switchToHttp().getRequest();

  return this.context.run(() => {
    const requestId = uuid();

    this.context.set('requestId', requestId);

    if (req.user) {
      this.context.set('userId', req.user.id);
      this.context.set('businessId', req.user.businessId);
    }

    return next.handle();
  });
}
}
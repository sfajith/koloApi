import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { RequestContextService } from '../logger/context/request-context.service';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private context: RequestContextService) {}

  intercept(contextExec: ExecutionContext, next: CallHandler): Observable<any> {
    const req = contextExec.switchToHttp().getRequest();

    return new Observable((observer) => {
      this.context.run(() => {
        const requestId = uuid();

        this.context.set('requestId', requestId);

        // 👇 esto luego se llena con auth
        if (req.user) {
          this.context.set('userId', req.user.id);
          this.context.set('businessId', req.user.businessId);
        }

        next.handle().subscribe(observer);
      });
    });
  }
}

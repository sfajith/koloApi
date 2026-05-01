import { Injectable, Logger } from '@nestjs/common';
import { RequestContextService } from '../logger/context/request-context.service';

@Injectable()
export class LoggerService {
  private logger = new Logger();

  constructor(private context: RequestContextService) {}

  private buildLog(message: any) {
    return {
      requestId: this.context.get('requestId'),
      userId: this.context.get('userId'),
      businessId: this.context.get('businessId'),
      ...message,
    };
  }

  log(message: any, context?: string) {
    this.logger.log(JSON.stringify(this.buildLog(message)), context);
  }

  warn(message: any, context?: string) {
    this.logger.warn(JSON.stringify(this.buildLog(message)), context);
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(JSON.stringify(this.buildLog(message)), trace, context);
  }
}

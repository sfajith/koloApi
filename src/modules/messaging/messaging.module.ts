import { Module } from '@nestjs/common';
import { WebhookController } from './controllers/webhook.controller';
import { IncomingMessageService } from './services/incoming-message.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { WhatsappProvider } from './providers/whatsapp/whatsapp.provider';


@Module({
  controllers: [WebhookController],
  providers: [IncomingMessageService, PrismaService, LoggerService, WhatsappProvider],
})
export class MessagingModule {}

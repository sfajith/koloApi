import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { AuthModule } from '../auth/auth.module';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ConversationsController],
  providers: [ConversationsService, LoggerService, PrismaService],
  imports: [AuthModule],
})
export class ConversationsModule {}

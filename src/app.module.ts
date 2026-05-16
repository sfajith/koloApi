import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersService } from './modules/users/users.service';
import { UsersModule } from './modules/users/users.module';
import { BusinessService } from './modules/business/business.service';
import { BusinessModule } from './modules/business/business.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerModule } from './common/logger/logger.module';
import { ConversationsModule } from './modules/conversations/conversations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    BusinessModule,
    PrismaModule,
    LoggerModule,
    ConversationsModule,
  ],
  controllers: [],
  providers: [UsersService, BusinessService],
})
export class AppModule {}

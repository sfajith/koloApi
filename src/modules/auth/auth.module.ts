import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoggerService } from 'src/common/logger/logger.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, LoggerService],
})
export class AuthModule {}

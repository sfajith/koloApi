import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { JwtModule } from '@nestjs/jwt';
import { PasswordService } from 'src/common/security/password.service';
import { TokenService } from 'src/common/security/token.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LoggerService, PasswordService, TokenService],
})
export class AuthModule {}

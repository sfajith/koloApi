import { Injectable } from '@nestjs/common';
import { loginDto } from './dto/login.dto';
import { registerDto } from './dto/register.dto';
import bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class AuthService {
  constructor(
    private logger: LoggerService,
    private prisma: PrismaService,
  ) {}
  login({ email, password }: loginDto) {
    return { email, password };
  }

  async register({
    name,
    lastName,
    phone,
    email,
    password,
    businessName,
  }: registerDto) {
    this.logger.log(
      {
        event: 'register_attempt',
        email,
        timestamp: new Date().toISOString(),
      },
      'AuthService',
    );
    const hashedPassword: string = await bcrypt.hash(password, 10);
    await this.prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: businessName,
          ownerId: '',
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          lastName,
          phone,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          businessId: business.id,
        },
      });

      await tx.business.update({
        where: { id: business.id },
        data: { ownerId: user.id },
      });

      return { user, business };
    });

    this.logger.log(
      {
        event: 'user_registered_successfully',
        email,
        timestamp: new Date().toISOString(),
      },
      'AuthService',
    );

    return {
      success: true,
      message: 'User created successfully',
      data: { email },
    };
  }
}

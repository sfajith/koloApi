import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { loginDto } from './dto/login.dto';
import { registerDto } from './dto/register.dto';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PasswordService } from 'src/common/security/password.service';
import { TokenService } from 'src/common/security/token.service';

@Injectable()
export class AuthService {
  constructor(
    private logger: LoggerService,
    private prisma: PrismaService,
    private tokenService: TokenService,
    private passwordService: PasswordService,
  ) {}
  async login({ email, password }: loginDto) {
    this.logger.log(
      {
        event: 'login_attempt',
        email,
      },
      'AuthService',
    );
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
        role: true,
        businessId: true,
        email: true,
      },
    });

    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const isPasswordValid = await this.passwordService.compare(password, user.password);

    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const payload = {
     sub: user.id,
     businessId: user.businessId,
     role: user.role,
     email: user.email,
    };

    const accessToken = await this.tokenService.sign(payload);

    this.logger.log(
      {
        event: 'login_success',
        email,
      },
      'AuthService',
    );

    return {
      success: true,
      message: 'Login successful',
      data: {
        userId: user.id,
        role: user.role,
        accessToken,
      },
    };
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
      },
      'AuthService',
    );
    const hashedPassword: string = await this.passwordService.hash(password);
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

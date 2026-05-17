import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';

import { AuthService } from './auth.service';

import { PrismaService } from 'src/prisma/prisma.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { PasswordService } from 'src/common/security/password.service';
import { TokenService } from 'src/common/security/token.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },

    business: {
      create: jest.fn(),
      update: jest.fn(),
    },

    $transaction: jest.fn(),
  };

  const loggerMock = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  const passwordServiceMock = {
    compare: jest.fn(),
    hash: jest.fn(),
  };

  const tokenServiceMock = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          AuthService,

          {
            provide: PrismaService,
            useValue: prismaMock,
          },

          {
            provide: LoggerService,
            useValue: loggerMock,
          },

          {
            provide: PasswordService,
            useValue: passwordServiceMock,
          },

          {
            provide: TokenService,
            useValue: tokenServiceMock,
          },
        ],
      }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-id',
        password: 'hashed-password',
        role: 'ADMIN',
        businessId: 'business-id',
        email: 'test@gmail.com',
      });

      passwordServiceMock.compare.mockResolvedValue(
        true,
      );

      tokenServiceMock.sign.mockResolvedValue(
        'fake-jwt-token',
      );

      const result = await service.login({
        email: 'test@gmail.com',
        password: '123456',
      });

      expect(result.success).toBe(true);

      expect(
        result.data.accessToken,
      ).toBe('fake-jwt-token');

      expect(
        prismaMock.user.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          email: 'test@gmail.com',
        },

        select: {
          id: true,
          password: true,
          role: true,
          businessId: true,
          email: true,
        },
      });

      expect(
        passwordServiceMock.compare,
      ).toHaveBeenCalledWith(
        '123456',
        'hashed-password',
      );

      expect(
        tokenServiceMock.sign,
      ).toHaveBeenCalled();
    });

    it('should throw if user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.login({
          email: 'fake@gmail.com',
          password: '123456',
        }),
      ).rejects.toThrow(
        new HttpException(
          'Invalid credentials',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });

    it('should throw if password is invalid', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-id',
        password: 'hashed-password',
        role: 'ADMIN',
        businessId: 'business-id',
        email: 'test@gmail.com',
      });

      passwordServiceMock.compare.mockResolvedValue(
        false,
      );

      await expect(
        service.login({
          email: 'test@gmail.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(
        new HttpException(
          'Invalid credentials',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      passwordServiceMock.hash.mockResolvedValue(
        'hashed-password',
      );

      prismaMock.$transaction.mockImplementation(
        async (callback) => {
          return callback({
            business: {
              create: jest
                .fn()
                .mockResolvedValue({
                  id: 'business-id',
                }),
            },

            user: {
              create: jest
                .fn()
                .mockResolvedValue({
                  id: 'user-id',
                }),
            },

            business: {
              create: jest
                .fn()
                .mockResolvedValue({
                  id: 'business-id',
                }),

              update: jest.fn(),
            },
          });
        },
      );

      const result = await service.register({
        name: 'John',
        lastName: 'Doe',
        phone: '3000000000',
        email: 'test@gmail.com',
        password: '123456',
        businessName: 'Test Business',
      });

      expect(result.success).toBe(true);

      expect(result.data.email).toBe(
        'test@gmail.com',
      );

      expect(
        passwordServiceMock.hash,
      ).toHaveBeenCalledWith('123456');

      expect(
        prismaMock.$transaction,
      ).toHaveBeenCalled();
    });
  });
});
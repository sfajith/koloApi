import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { JwtService } from '@nestjs/jwt';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('sign', () => {
    it('should generate a token', async () => {
      const payload = { userId: '123', role: 'ADMIN' };

      (jwtService.signAsync as jest.Mock).mockResolvedValue('mocked-token');

      const token = await service.sign(payload);

      expect(token).toBe('mocked-token');
      expect(jwtService.signAsync).toHaveBeenCalledWith(payload);
    });
  });

  describe('verify', () => {
    it('should verify token and return payload', async () => {
      const payload = { userId: '123' };

      (jwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);

      const result = await service.verify('token');

      expect(result).toEqual(payload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token');
    });
  });
});
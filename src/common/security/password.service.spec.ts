import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  describe('hash', () => {
    it('should hash a password', async () => {
      const password = '123456';

      const hash = await service.hash(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
    });

    it('should generate different hashes for same password', async () => {
      const password = '123456';

      const hash1 = await service.hash(password);
      const hash2 = await service.hash(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compare', () => {
    it('should return true for correct password', async () => {
      const password = '123456';
      const hash = await service.hash(password);

      const isMatch = await service.compare(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = '123456';
      const wrongPassword = '654321';

      const hash = await service.hash(password);

      const isMatch = await service.compare(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });
  });
});
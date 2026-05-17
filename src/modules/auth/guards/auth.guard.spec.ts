import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { TokenService } from '../../../common/security/token.service';
import { RequestContextService } from 'src/common/logger/context/request-context.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  let mockTokenService: {
    verify: jest.Mock;
  };

  let mockRequestContext: {
    set: jest.Mock;
  };

  const mockPayload = {
    sub: 'user-id',
    businessId: 'business-id',
    role: 'ADMIN',
    email: 'test@gmail.com',
  };

  beforeEach(() => {
    mockTokenService = {
      verify: jest.fn(),
    };

    mockRequestContext = {
      set: jest.fn(),
    };

    guard = new AuthGuard(
      mockRequestContext as any,
      mockTokenService as any,
    );
  });

  const createExecutionContext = (
    authorization?: string,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization,
          },
        }),
      }),
    } as ExecutionContext;
  };

  it('should allow access with valid token', async () => {
    mockTokenService.verify.mockResolvedValue(
      mockPayload,
    );

    const context = createExecutionContext(
      'Bearer valid-token',
    );

    const result = await guard.canActivate(
      context,
    );

    expect(result).toBe(true);

    expect(
      mockTokenService.verify,
    ).toHaveBeenCalledWith('valid-token');

    expect(
      mockRequestContext.set,
    ).toHaveBeenCalledWith(
      'userId',
      mockPayload.sub,
    );

    expect(
      mockRequestContext.set,
    ).toHaveBeenCalledWith(
      'businessId',
      mockPayload.businessId,
    );
  });

  it('should throw if no authorization header', async () => {
    const context = createExecutionContext();

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(
      new UnauthorizedException(
        'No token provided',
      ),
    );
  });

  it('should throw if token format is invalid', async () => {
    const context = createExecutionContext(
      'InvalidToken',
    );

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(
      new UnauthorizedException(
        'Invalid token format',
      ),
    );
  });

  it('should throw if token type is not Bearer', async () => {
    const context = createExecutionContext(
      'Basic token',
    );

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(
      new UnauthorizedException(
        'Invalid token format',
      ),
    );
  });

  it('should throw if token verification fails', async () => {
    mockTokenService.verify.mockRejectedValue(
      new Error('Invalid token'),
    );

    const context = createExecutionContext(
      'Bearer invalid-token',
    );

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(
      new UnauthorizedException(
        'Invalid or expired token',
      ),
    );
  });

  it('should attach user to request', async () => {
    mockTokenService.verify.mockResolvedValue(
      mockPayload,
    );

    const request: any = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;

    await guard.canActivate(context);

    expect(request.user).toEqual(
      mockPayload,
    );
  });
});
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RequestContextService } from 'src/common/logger/context/request-context.service';
import { TokenService } from '../../../common/security/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private context: RequestContextService,
    private tokenService: TokenService,
  ) {}

  async canActivate(contextExec: ExecutionContext): Promise<boolean> {
    const request = contextExec.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const payload = await this.tokenService.verify(token);

      // ✅ attach user to request
      request.user = payload;

      // ✅ context para logs
      this.context.set('userId', payload.sub);
      this.context.set('businessId', payload.businessId);

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginDto } from './dto/login.dto';
import { registerDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/login')
  login(@Body() body: loginDto) {
    return this.authService.login(body);
  }

  @Post('/register')
  register(@Body() body: registerDto) {
    return this.authService.register(body);
  }
}

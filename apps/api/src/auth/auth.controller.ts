import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

import { CurrentUser, Public, AuthUser } from '../common/decorators';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto } from './dto';

class ForgotPasswordDto {
  @IsEmail() email!: string;
}

class ResetPasswordDto {
  @IsString() token!: string;
  @IsString() @MinLength(8) password!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @HttpCode(204)
  @Post('logout')
  async logout(@CurrentUser() user: AuthUser, @Body() dto: RefreshDto) {
    await this.auth.logout(user.id, dto.refreshToken);
  }

  /**
   * Démarre un flow de reset password.
   * Rate limit serré pour éviter le spam / enumeration / DoS sur les emails.
   * Réponse toujours 204 — on ne révèle pas si l'email existe (anti-énumération).
   */
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @HttpCode(204)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email);
  }

  @Public()
  @HttpCode(204)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.password);
  }
}

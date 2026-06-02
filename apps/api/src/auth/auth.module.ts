import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { OAuthController } from './oauth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const secret = cfg.get<string>('JWT_ACCESS_SECRET');
        if (!secret && cfg.get<string>('NODE_ENV') === 'production') {
          throw new Error('JWT_ACCESS_SECRET est obligatoire en production');
        }
        return {
          secret: secret ?? 'dev-only-fallback-secret-do-not-use-in-prod',
          signOptions: { expiresIn: cfg.get<string>('JWT_ACCESS_TTL') ?? '15m' },
        };
      },
    }),
  ],
  controllers: [AuthController, OAuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}

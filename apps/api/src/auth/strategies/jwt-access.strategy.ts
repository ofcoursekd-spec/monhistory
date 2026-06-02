import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthUser } from '../../common/decorators';

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    const isProd = config.get<string>('NODE_ENV') === 'production';
    if (!secret) {
      if (isProd) {
        // Fail loud : un secret vide en prod = JWT trivialement forgeables.
        throw new Error('JWT_ACCESS_SECRET est obligatoire en production');
      }
      // eslint-disable-next-line no-console
      console.warn(
        '[Auth] JWT_ACCESS_SECRET manquant — utilisation d\'un secret dev par défaut.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret ?? 'dev-only-fallback-secret-do-not-use-in-prod',
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}

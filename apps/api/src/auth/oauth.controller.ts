import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthProvider } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { IsIn, IsString } from 'class-validator';

import { Public } from '../common/decorators';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

class OAuthDto {
  @IsIn(['google', 'facebook', 'apple']) provider!: 'google' | 'facebook' | 'apple';
  @IsString() idToken!: string; // token reçu côté client (Google ID token, Apple identityToken, Facebook access_token)
}

@ApiTags('auth')
@Controller('auth/oauth')
export class OAuthController {
  private google: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    this.google = new OAuth2Client(config.get<string>('GOOGLE_CLIENT_ID'));
  }

  @Public()
  @Post()
  async oauth(@Body() dto: OAuthDto) {
    const profile = await this.verify(dto.provider, dto.idToken);
    const provider =
      dto.provider === 'google'
        ? AuthProvider.GOOGLE
        : dto.provider === 'facebook'
          ? AuthProvider.FACEBOOK
          : AuthProvider.APPLE;

    const user = await this.prisma.user.upsert({
      where: { email: profile.email },
      update: { provider, providerId: profile.sub },
      create: {
        email: profile.email,
        name: profile.name ?? profile.email.split('@')[0],
        avatarUrl: profile.picture,
        provider,
        providerId: profile.sub,
        emailVerifiedAt: new Date(),
      },
    });
    return this.auth.issueTokens(user);
  }

  private async verify(
    provider: 'google' | 'facebook' | 'apple',
    idToken: string,
  ): Promise<{ sub: string; email: string; name?: string; picture?: string }> {
    if (provider === 'google') {
      const ticket = await this.google.verifyIdToken({ idToken });
      const p = ticket.getPayload();
      if (!p?.email) throw new BadRequestException('Token Google invalide');
      return { sub: p.sub, email: p.email, name: p.name, picture: p.picture };
    }
    if (provider === 'apple') {
      const jwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
      const { payload } = await jwtVerify(idToken, jwks, {
        issuer: 'https://appleid.apple.com',
      });
      const sub = payload.sub;
      const email = (payload as { email?: string }).email;
      if (!sub || !email) throw new BadRequestException('Token Apple invalide');
      return { sub, email };
    }
    if (provider === 'facebook') {
      const { data } = await axios.get<{ id: string; email: string; name: string; picture: { data: { url: string } } }>(
        'https://graph.facebook.com/me',
        { params: { fields: 'id,email,name,picture', access_token: idToken } },
      );
      if (!data.email) throw new BadRequestException('Token Facebook sans email');
      return { sub: data.id, email: data.email, name: data.name, picture: data.picture?.data?.url };
    }
    throw new BadRequestException(`Provider ${provider} inconnu`);
  }
}

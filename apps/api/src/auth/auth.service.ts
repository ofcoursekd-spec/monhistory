import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'node:crypto';

import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTokens, LoginDto, RegisterDto } from './dto';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1h

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
      },
    });

    // Fire-and-forget : on ne bloque pas l'inscription si l'email échoue.
    this.email.sendWelcome(user.email, user.name).catch((err) => {
      this.logger.warn(`Welcome email failed for ${user.email}: ${err}`);
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash) throw new UnauthorizedException('Identifiants invalides');

    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Identifiants invalides');

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(refreshToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(record.user);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ---------------------------------------------------------------------------
  // Reset password
  // ---------------------------------------------------------------------------

  /**
   * Démarre un flow de reset. NE révèle PAS si l'email existe — réponse identique
   * dans les deux cas pour empêcher l'énumération de comptes.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // silencieux

    // Invalide d'anciens tokens en cours pour ce user.
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });

    const siteUrl = this.config.get<string>('PUBLIC_SITE_URL') ?? 'http://localhost:3001';
    const resetUrl = `${siteUrl}/reinitialisation?token=${token}`;
    await this.email.sendPasswordReset(user.email, resetUrl);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8) throw new BadRequestException('Mot de passe trop court (8+)');

    const tokenHash = this.hashToken(token);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Lien expiré ou invalide');
    }

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Révoque tous les refresh tokens du user — force re-login partout.
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  // ---------------------------------------------------------------------------

  async issueTokens(user: User): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = randomBytes(48).toString('hex');
    const ttlDays = this.parseDays(this.config.get<string>('JWT_REFRESH_TTL') ?? '30d');
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseDays(ttl: string): number {
    const match = /^(\d+)d$/.exec(ttl);
    return match ? Number(match[1]) : 30;
  }

  async ensureAdmin(role: Role): Promise<void> {
    if (role !== Role.ADMIN) throw new UnauthorizedException('Réservé aux administrateurs');
  }
}

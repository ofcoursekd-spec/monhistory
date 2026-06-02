import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/** Niveau d'accès d'un utilisateur à un chapitre donné. */
export type ChapterAccess =
  | { kind: 'full' } // admin, abonnement actif, ou livre acheté
  | { kind: 'preview'; previewCount: number } // chapitre 1 uniquement, les N premières pages (par order asc)
  | { kind: 'denied' };

/**
 * Centralise la règle d'accès à un chapitre.
 *
 * Règle :
 *   - Admin → accès complet à tout
 *   - Abonné (status ACTIVE non expiré) → accès complet à tout
 *   - Acheteur du livre → accès complet à ce livre
 *   - Chapitre numéro 1 → accès aux N premières pages (FREE_PREVIEW_PAGES, défaut 3)
 *   - Tout le reste → refusé
 */
@Injectable()
export class AccessService {
  private readonly previewPages: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.previewPages = Number(config.get<string>('FREE_PREVIEW_PAGES') ?? 3);
  }

  /** Throw si l'utilisateur n'a même pas d'aperçu — utilisé en garde de contrôleur. */
  async assertChapterAccessible(userId: string, chapterId: string): Promise<void> {
    const access = await this.resolve(userId, chapterId);
    if (access.kind === 'denied') {
      throw new ForbiddenException('Ce chapitre nécessite un abonnement Premium ou l\'achat du livre.');
    }
  }

  /** Détaille le niveau d'accès — utilisé pour filtrer les pages côté service. */
  async resolve(userId: string, chapterId: string): Promise<ChapterAccess> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { number: true, bookId: true },
    });
    if (!chapter) return { kind: 'denied' };

    const [user, sub, purchase] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
      this.prisma.subscription.findFirst({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
          endsAt: { gt: new Date() },
        },
        select: { id: true },
      }),
      this.prisma.purchase.findUnique({
        where: { userId_bookId: { userId, bookId: chapter.bookId } },
        select: { id: true },
      }),
    ]);

    if (user?.role === 'ADMIN' || sub || purchase) {
      return { kind: 'full' };
    }
    if (chapter.number === 1) {
      return { kind: 'preview', previewCount: this.previewPages };
    }
    return { kind: 'denied' };
  }
}

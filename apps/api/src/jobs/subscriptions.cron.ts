import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionStatus } from '@prisma/client';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsCron {
  private readonly logger = new Logger(SubscriptionsCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // Toutes les heures : expirer les abos arrivés à terme
  @Cron(CronExpression.EVERY_HOUR)
  async expire() {
    const result = await this.prisma.subscription.updateMany({
      where: { status: SubscriptionStatus.ACTIVE, endsAt: { lt: new Date() } },
      data: { status: SubscriptionStatus.EXPIRED },
    });
    if (result.count > 0) this.logger.log(`Abonnements expirés : ${result.count}`);
  }

  // Tous les jours à 9h : prévenir les abos qui expirent dans 3 jours
  @Cron('0 9 * * *')
  async warnExpiring() {
    const in3days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const subs = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endsAt: { lt: in3days, gt: new Date() },
      },
      select: { userId: true, endsAt: true },
    });
    for (const s of subs) {
      await this.notifications.notify(
        s.userId,
        'SUB_EXPIRING',
        'Ton abonnement expire bientôt',
        `Renouvelle ton abonnement avant le ${s.endsAt.toLocaleDateString('fr-FR')} pour continuer à lire sans interruption.`,
      );
    }
  }
}

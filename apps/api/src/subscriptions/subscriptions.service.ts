import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';

import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

  /** Liste publique des plans actifs (1 seul prévu en V1). */
  async listPlans() {
    const plans = await this.prisma.plan.findMany({
      where: { active: true },
      orderBy: { priceFcfa: 'asc' },
      select: { code: true, name: true, priceFcfa: true, durationDays: true },
    });
    return plans.map((p) => ({
      code: p.code,
      name: p.name,
      price: p.priceFcfa,
      currency: 'XOF',
      durationDays: p.durationDays,
    }));
  }

  async myStatus(userId: string) {
    const active = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        endsAt: { gt: new Date() },
      },
      orderBy: { endsAt: 'desc' },
    });
    return { active: Boolean(active), subscription: active };
  }

  /**
   * Démarre le paiement d'un abonnement. Le prix vient EXCLUSIVEMENT du modèle
   * Plan en DB — jamais d'un input client. Sécurité contre la falsification de
   * montant.
   */
  async subscribe(userId: string, planCode: string, callbackUrl: string) {
    const plan = await this.prisma.plan.findUnique({ where: { code: planCode } });
    if (!plan || !plan.active) throw new NotFoundException('Plan introuvable ou inactif');

    // Empêche un user déjà abonné de racheter (anti double-facturation).
    const existing = await this.myStatus(userId);
    if (existing.active) {
      throw new BadRequestException('Un abonnement actif est déjà en cours');
    }

    return this.payments.startSubscription(userId, plan, callbackUrl);
  }

  async cancel(userId: string, id: string) {
    const sub = await this.prisma.subscription.findFirst({ where: { id, userId } });
    if (!sub) throw new NotFoundException('Abonnement introuvable');
    return this.prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CANCELED, canceledAt: new Date() },
    });
  }
}

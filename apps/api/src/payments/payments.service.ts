import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Payment,
  PaymentProvider,
  PaymentPurpose,
  PaymentStatus,
  Plan,
  Prisma,
  SubscriptionStatus,
} from '@prisma/client';

import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeniusPayProvider } from './providers/geniuspay.provider';

const PAYMENT_TTL_SECONDS = 30 * 60;

/** Mappe les events GeniusPay vers nos statuts internes. */
function mapGeniusPayEvent(event: string): PaymentStatus | 'IGNORE' {
  switch (event) {
    case 'payment.success':
      return PaymentStatus.SUCCEEDED;
    case 'payment.failed':
    case 'payment.cancelled':
    case 'payment.expired':
      return PaymentStatus.FAILED;
    case 'payment.refunded':
      return PaymentStatus.REFUNDED;
    default:
      return 'IGNORE';
  }
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly publicSiteUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly geniuspay: GeniusPayProvider,
    private readonly email: EmailService,
    config: ConfigService,
  ) {
    this.publicSiteUrl =
      config.get<string>('PUBLIC_SITE_URL') ?? 'http://localhost:3001';
  }

  // ---------------------------------------------------------------------------
  // Démarrage des paiements
  // ---------------------------------------------------------------------------

  async startBookPurchase(userId: string, bookId: string, callbackUrl: string) {
    const [user, book, alreadyOwned] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      }),
      this.prisma.book.findUnique({
        where: { id: bookId },
        select: { id: true, price: true, title: true },
      }),
      this.prisma.purchase.findUnique({ where: { userId_bookId: { userId, bookId } } }),
    ]);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (!book) throw new NotFoundException('Livre introuvable');
    if (alreadyOwned) throw new BadRequestException('Livre déjà acheté');
    if (book.price <= 0) throw new BadRequestException('Livre non vendu à l\'unité');

    const reused = await this.findReusablePending(userId, PaymentPurpose.BOOK_PURCHASE, {
      bookId,
    });
    if (reused) {
      const url = this.checkoutUrlFromMetadata(reused);
      if (url) return { paymentId: reused.id, checkoutUrl: url };
      // Si on n'a pas l'URL stockée (ancien PENDING), on en crée un nouveau ci-dessous.
    }

    return this.createPaymentAndCheckout({
      userId,
      email: user.email,
      name: user.name,
      amount: book.price,
      purpose: PaymentPurpose.BOOK_PURCHASE,
      description: `MonHistory — Achat de "${book.title}"`,
      metadata: { bookId },
      callbackUrl,
    });
  }

  async startSubscription(userId: string, plan: Plan, callbackUrl: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const reused = await this.findReusablePending(userId, PaymentPurpose.SUBSCRIPTION, {
      planCode: plan.code,
    });
    if (reused) {
      const url = this.checkoutUrlFromMetadata(reused);
      if (url) return { paymentId: reused.id, checkoutUrl: url };
    }

    return this.createPaymentAndCheckout({
      userId,
      email: user.email,
      name: user.name,
      amount: plan.priceFcfa,
      purpose: PaymentPurpose.SUBSCRIPTION,
      description: `MonHistory — Abonnement ${plan.name}`,
      metadata: {
        planId: plan.id,
        planCode: plan.code,
        durationDays: plan.durationDays,
      },
      callbackUrl,
    });
  }

  private async createPaymentAndCheckout(args: {
    userId: string;
    email: string;
    name: string;
    amount: number;
    purpose: PaymentPurpose;
    description: string;
    metadata: Record<string, unknown>;
    callbackUrl: string;
  }) {
    const payment = await this.prisma.payment.create({
      data: {
        userId: args.userId,
        amount: args.amount,
        currency: 'XOF',
        provider: PaymentProvider.GENIUSPAY,
        purpose: args.purpose,
        status: PaymentStatus.PENDING,
        metadata: args.metadata as Prisma.InputJsonValue,
      },
    });

    let checkout: { providerRef: string; checkoutUrl: string };
    try {
      checkout = await this.geniuspay.createCheckout({
        internalPaymentId: payment.id,
        amount: payment.amount,
        currency: 'XOF',
        description: args.description,
        customerEmail: args.email,
        customerName: args.name,
        successUrl: args.callbackUrl,
        errorUrl: this.errorUrl(),
        metadata: {
          purpose: args.purpose,
        },
      });
    } catch (err) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      throw err;
    }

    // Stocke aussi l'URL de checkout dans metadata pour qu'on puisse la réutiliser
    // si le user reclique avant que le paiement soit terminé.
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerRef: checkout.providerRef,
        metadata: {
          ...((payment.metadata ?? {}) as Prisma.JsonObject),
          checkout_url: checkout.checkoutUrl,
        } as Prisma.InputJsonValue,
      },
    });
    return { paymentId: payment.id, checkoutUrl: checkout.checkoutUrl };
  }

  private errorUrl() {
    return `${this.publicSiteUrl}/paiement/erreur`;
  }

  private checkoutUrlFromMetadata(payment: Payment): string | null {
    const url = (payment.metadata as { checkout_url?: string } | null)?.checkout_url;
    return typeof url === 'string' ? url : null;
  }

  private async findReusablePending(
    userId: string,
    purpose: PaymentPurpose,
    matchMetadata: Record<string, string>,
  ): Promise<Payment | null> {
    const since = new Date(Date.now() - PAYMENT_TTL_SECONDS * 1000);
    const candidates = await this.prisma.payment.findMany({
      where: { userId, purpose, status: PaymentStatus.PENDING, createdAt: { gt: since } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    return (
      candidates.find((c) => {
        const meta = (c.metadata ?? {}) as Record<string, unknown>;
        return Object.entries(matchMetadata).every(([k, v]) => meta[k] === v);
      }) ?? null
    );
  }

  // ---------------------------------------------------------------------------
  // Webhook GeniusPay
  // ---------------------------------------------------------------------------

  async handleGeniusPayWebhook(
    rawBody: string,
    signature: string | undefined,
    timestamp: string | undefined,
    event: {
      id: string;
      event: string;
      data: {
        reference: string;
        amount: number;
        currency: string;
        status: string;
        metadata?: Record<string, unknown>;
      };
    },
  ) {
    if (!this.geniuspay.verifyWebhook(rawBody, event, signature, timestamp)) {
      this.logger.warn(`Webhook GeniusPay rejeté — signature ou timestamp invalides`);
      throw new ForbiddenException('Signature invalide');
    }

    const mapped = mapGeniusPayEvent(event.event);
    if (mapped === 'IGNORE') {
      this.logger.log(`Event GeniusPay ignoré : ${event.event}`);
      return;
    }

    // Retrouve notre paiement : d'abord par metadata.internal_payment_id (chemin direct
    // quand le backend a créé le paiement via REST), sinon par providerRef = "MTX-..."
    // (fallback si on l'a stocké), sinon on tente de le matérialiser à la volée
    // (cas du SDK client React/Flutter qui crée le paiement directement chez GeniusPay).
    const internalId = event.data.metadata?.internal_payment_id as string | undefined;
    let payment = internalId
      ? await this.prisma.payment.findUnique({ where: { id: internalId } })
      : await this.prisma.payment.findUnique({ where: { providerRef: event.data.reference } });

    if (!payment) {
      payment = await this.materializeFromMetadata(event);
    }
    if (!payment) {
      this.logger.warn(`Webhook reçu pour paiement inconnu (ref=${event.data.reference})`);
      throw new NotFoundException('Paiement introuvable');
    }

    // Idempotence — un événement rejoué n'altère pas l'état.
    if (payment.status !== PaymentStatus.PENDING) {
      this.logger.log(`Webhook rejoué pour ${payment.id} (status ${payment.status})`);
      return;
    }

    // Anti-tampering — déterminer le montant ATTENDU depuis la source de vérité.
    // Cas 1 : paiement créé par le backend → payment.amount est de confiance.
    // Cas 2 : paiement matérialisé depuis le webhook (SDK client) → re-lookup du
    //         Plan ou du Book pour vérifier que l'amount n'a pas été tampered
    //         côté client avant l'envoi à GeniusPay.
    let trustedAmount = payment.amount;
    if (payment.purpose === PaymentPurpose.SUBSCRIPTION) {
      const planCode = (payment.metadata as { plan_code?: string })?.plan_code;
      if (planCode) {
        const plan = await this.prisma.plan.findUnique({ where: { code: planCode } });
        if (plan) trustedAmount = plan.priceFcfa;
      }
    } else if (payment.purpose === PaymentPurpose.BOOK_PURCHASE) {
      const m = payment.metadata as { bookId?: string; book_id?: string };
      const bookId = m.bookId ?? m.book_id;
      if (bookId) {
        const book = await this.prisma.book.findUnique({ where: { id: bookId } });
        if (book) trustedAmount = book.price;
      }
    }

    // GeniusPay peut envoyer 1999.00 (float) ou "1999" (string) — on normalise au centime.
    const receivedAmount = Math.round(Number(event.data.amount) * 100);
    const expectedAmount = Math.round(trustedAmount * 100);
    if (!Number.isFinite(receivedAmount) || receivedAmount !== expectedAmount) {
      this.logger.error(
        `Montant divergent webhook ${payment.id} : attendu ${payment.amount}, reçu ${event.data.amount}`,
      );
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          metadata: {
            ...((payment.metadata ?? {}) as Prisma.JsonObject),
            tamperingDetected: true,
          } as Prisma.InputJsonValue,
        },
      });
      throw new BadRequestException('Montant incohérent');
    }
    if (event.data.currency !== payment.currency) {
      throw new BadRequestException('Devise incohérente');
    }

    if (mapped === PaymentStatus.FAILED) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      return;
    }

    if (mapped === PaymentStatus.REFUNDED) {
      // TODO V2 : flow de remboursement (annulation Subscription, etc.)
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REFUNDED },
      });
      return;
    }

    await this.fulfill(payment);
  }

  private async fulfill(payment: Payment) {
    await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.payment.findUnique({ where: { id: payment.id } });
      if (!fresh || fresh.status !== PaymentStatus.PENDING) return;

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.SUCCEEDED },
      });

      if (payment.purpose === PaymentPurpose.BOOK_PURCHASE) {
        const m = payment.metadata as { bookId?: string; book_id?: string };
        const bookId = m.bookId ?? m.book_id;
        if (!bookId) return;
        await tx.purchase.create({
          data: {
            userId: payment.userId,
            bookId,
            amount: payment.amount,
            paymentId: payment.id,
          },
        });
      } else if (payment.purpose === PaymentPurpose.SUBSCRIPTION) {
        // metadata peut venir du backend (durationDays:number) ou du SDK React (duration_days:string).
        const meta = payment.metadata as { durationDays?: number; duration_days?: string | number };
        const durationDays = Number(meta.durationDays ?? meta.duration_days ?? 30);
        const startsAt = new Date();
        const endsAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
        await tx.subscription.create({
          data: {
            userId: payment.userId,
            plan: 'MONTHLY',
            status: SubscriptionStatus.ACTIVE,
            startsAt,
            endsAt,
            paymentId: payment.id,
          },
        });
      }
    });
    this.logger.log(`Paiement ${payment.id} confirmé et fulfillé`);

    // Reçu par email (fire-and-forget : on ne fait pas échouer le webhook si email plante).
    this.sendReceipt(payment).catch((err) => {
      this.logger.warn(`Receipt email failed for payment ${payment.id}: ${err}`);
    });
  }

  private async sendReceipt(payment: Payment) {
    const user = await this.prisma.user.findUnique({
      where: { id: payment.userId },
      select: { email: true },
    });
    if (!user?.email) return;

    let description = 'MonHistory';
    if (payment.purpose === PaymentPurpose.SUBSCRIPTION) {
      const meta = payment.metadata as { plan_code?: string };
      description = `Abonnement Premium ${meta.plan_code ?? ''}`.trim();
    } else if (payment.purpose === PaymentPurpose.BOOK_PURCHASE) {
      const m = payment.metadata as { bookId?: string; book_id?: string };
      const bookId = m.bookId ?? m.book_id;
      if (bookId) {
        const book = await this.prisma.book.findUnique({
          where: { id: bookId },
          select: { title: true },
        });
        description = `Achat de "${book?.title ?? 'livre'}"`;
      }
    }

    await this.email.sendPaymentReceipt(user.email, {
      to: user.email,
      paymentRef: payment.providerRef ?? payment.id,
      amount: payment.amount,
      description,
      paidAt: new Date(),
    });
  }

  // ---------------------------------------------------------------------------
  // Maintenance (cron)
  // ---------------------------------------------------------------------------

  /**
   * Crée à la volée un Payment quand le webhook arrive sans qu'on ait pré-créé
   * le paiement côté serveur (cas du SDK client React/Flutter qui parle
   * directement à GeniusPay). Validation stricte : metadata.user_id doit exister
   * et l'utilisateur doit être en DB, la devise doit être XOF, et le purpose
   * doit être reconnu.
   */
  private async materializeFromMetadata(event: {
    data: {
      reference: string;
      amount: number;
      currency: string;
      metadata?: Record<string, unknown>;
    };
  }): Promise<Payment | null> {
    const meta = event.data.metadata ?? {};
    const userId = meta.user_id as string | undefined;
    const purposeRaw = (meta.purpose as string | undefined) ?? 'SUBSCRIPTION';
    if (!userId) return null;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const purpose =
      purposeRaw === 'BOOK_PURCHASE' ? PaymentPurpose.BOOK_PURCHASE : PaymentPurpose.SUBSCRIPTION;

    return this.prisma.payment.create({
      data: {
        userId,
        amount: Math.round(Number(event.data.amount)),
        currency: event.data.currency || 'XOF',
        provider: PaymentProvider.GENIUSPAY,
        purpose,
        status: PaymentStatus.PENDING,
        providerRef: event.data.reference,
        metadata: meta as Prisma.InputJsonValue,
      },
    });
  }

  async expireStalePayments() {
    const cutoff = new Date(Date.now() - PAYMENT_TTL_SECONDS * 1000);
    const result = await this.prisma.payment.updateMany({
      where: { status: PaymentStatus.PENDING, createdAt: { lt: cutoff } },
      data: { status: PaymentStatus.FAILED },
    });
    if (result.count > 0) this.logger.log(`Paiements expirés : ${result.count}`);
    return result.count;
  }
}

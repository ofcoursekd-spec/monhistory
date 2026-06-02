import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PaymentProvider, PaymentPurpose, PaymentStatus } from '@prisma/client';
import * as bodyParser from 'body-parser';
import type { IncomingMessage, ServerResponse } from 'http';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Vérifie l'idempotence du webhook GeniusPay et la création d'un abonnement actif.
 * Le test n'envoie PAS de signature webhook : en NODE_ENV != production, le
 * provider GeniusPay accepte les webhooks sans vérification (dev only).
 */
describe('Payments webhook (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let paymentId: string;
  let planCode: string;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    // Reproduit le middleware de main.ts : préserve le raw body pour HMAC.
    app.use(
      bodyParser.json({
        verify: (req: IncomingMessage, _res: ServerResponse, buf: Buffer) => {
          (req as IncomingMessage & { rawBody?: string }).rawBody = buf.toString('utf8');
        },
      }),
    );
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    // Plan en DB (source de vérité du montant pour l'anti-tampering).
    planCode = `TEST_PLAN_${Date.now()}`;
    await prisma.plan.create({
      data: {
        code: planCode,
        name: 'Test Plan',
        priceFcfa: 2000,
        durationDays: 30,
        active: true,
      },
    });

    const user = await prisma.user.create({
      data: {
        email: `pay_${Date.now()}@monhistory.app`,
        name: 'Pay',
        passwordHash: 'x',
      },
    });
    userId = user.id;

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: 2000,
        currency: 'XOF',
        provider: PaymentProvider.GENIUSPAY,
        purpose: PaymentPurpose.SUBSCRIPTION,
        status: PaymentStatus.PENDING,
        metadata: { plan_code: planCode, duration_days: 30 },
      },
    });
    paymentId = payment.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.plan.deleteMany({ where: { code: planCode } });
    await app.close();
  });

  /** Construit un payload webhook GeniusPay valide. */
  const buildEvent = (overrides: Record<string, unknown> = {}) => ({
    id: `evt_${Date.now()}`,
    event: 'payment.success',
    timestamp: Math.floor(Date.now() / 1000),
    environment: 'sandbox',
    data: {
      reference: `MTX-TEST-${Date.now()}`,
      amount: 2000,
      currency: 'XOF',
      status: 'completed',
      metadata: { internal_payment_id: paymentId },
      ...overrides,
    },
  });

  it('crée un abonnement actif sur payment.success', async () => {
    await request(app.getHttpServer())
      .post('/payments/webhooks/geniuspay')
      .send(buildEvent())
      .expect(200);

    const sub = await prisma.subscription.findFirst({ where: { userId } });
    expect(sub?.status).toBe('ACTIVE');
  });

  it('est idempotent (rejeu n\'crée pas un 2e abonnement)', async () => {
    await request(app.getHttpServer())
      .post('/payments/webhooks/geniuspay')
      .send(buildEvent())
      .expect(200);
    const count = await prisma.subscription.count({ where: { userId } });
    expect(count).toBe(1);
  });
});

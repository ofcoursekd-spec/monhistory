import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PaymentProvider, PaymentPurpose, PaymentStatus, SubscriptionPlan } from '@prisma/client';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Vérifie l'idempotence du webhook de paiement et la création d'un abonnement actif.
 */
describe('Payments webhook (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let paymentId: string;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

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
        metadata: { plan: SubscriptionPlan.MONTHLY },
      },
    });
    paymentId = payment.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await app.close();
  });

  it('crée un abonnement actif au callback SUCCEEDED', async () => {
    await request(app.getHttpServer())
      .post('/payments/webhooks/geniuspay')
      .send({ paymentReference: paymentId, status: 'SUCCEEDED' })
      .expect(200);

    const sub = await prisma.subscription.findFirst({ where: { userId } });
    expect(sub?.status).toBe('ACTIVE');
    expect(sub?.plan).toBe('MONTHLY');
  });

  it('est idempotent (rejeu)', async () => {
    await request(app.getHttpServer())
      .post('/payments/webhooks/geniuspay')
      .send({ paymentReference: paymentId, status: 'SUCCEEDED' })
      .expect(200);
    const count = await prisma.subscription.count({ where: { userId } });
    expect(count).toBe(1);
  });
});

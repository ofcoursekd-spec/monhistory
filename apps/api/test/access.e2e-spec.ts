import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BookStatus, Category, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Vérifie la règle d'accès durcie :
 *   - Chapitre 1 visible mais ne renvoie que les 3 premières pages (preview)
 *   - Chapitre 2+ inaccessible (404) sans abonnement / achat
 *   - Avec un abonnement actif : chapitre 1 renvoie TOUTES les pages, chapitre 2+ aussi
 */
describe('Access control (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let chapter1Id: string;
  let chapter2Id: string;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `access_${Date.now()}@monhistory.app`,
        name: 'Access',
        password: 'password123',
      });
    token = reg.body.accessToken;
    const me = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`);
    userId = me.body.id;

    const book = await prisma.book.create({
      data: {
        slug: `access-test-${Date.now()}`,
        title: 'Access test',
        description: 'd',
        author: 'a',
        coverImageUrl: 'https://stub.local/c.jpg',
        category: Category.AMOUR,
        price: 0,
        status: BookStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
    const c1 = await prisma.chapter.create({
      data: { bookId: book.id, number: 1, title: 'C1' },
    });
    const c2 = await prisma.chapter.create({
      data: { bookId: book.id, number: 2, title: 'C2' },
    });
    // 5 pages dans chaque chapitre
    for (const c of [c1, c2]) {
      for (let i = 1; i <= 5; i++) {
        await prisma.page.create({
          data: { chapterId: c.id, order: i, imageKey: `stub/${c.number}/${i}.webp` },
        });
      }
    }
    chapter1Id = c1.id;
    chapter2Id = c2.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await app.close();
  });

  it('chapitre 1 : renvoie un aperçu de 3 pages pour un user non abonné', async () => {
    const res = await request(app.getHttpServer())
      .get(`/chapters/${chapter1Id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.preview).toBe(true);
    expect(res.body.totalPages).toBe(5);
    expect(res.body.pages).toHaveLength(3);
    expect(res.body.pages.map((p: { order: number }) => p.order)).toEqual([1, 2, 3]);
  });

  it('chapitre 2 : 404 pour un user non abonné (pas d\'info qui leak)', async () => {
    await request(app.getHttpServer())
      .get(`/chapters/${chapter2Id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('avec un abonnement actif, chapitre 1 renvoie les 5 pages', async () => {
    await prisma.subscription.create({
      data: {
        userId,
        plan: SubscriptionPlan.MONTHLY,
        status: SubscriptionStatus.ACTIVE,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    const res = await request(app.getHttpServer())
      .get(`/chapters/${chapter1Id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.preview).toBe(false);
    expect(res.body.pages).toHaveLength(5);
  });

  it('avec un abonnement actif, chapitre 2 est accessible', async () => {
    const res = await request(app.getHttpServer())
      .get(`/chapters/${chapter2Id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.preview).toBe(false);
    expect(res.body.pages).toHaveLength(5);
  });
});

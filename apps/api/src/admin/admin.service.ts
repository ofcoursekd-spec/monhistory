import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async kpis() {
    const [users, activeSubs, revenueAgg, popular] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE, endsAt: { gt: new Date() } },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.SUCCEEDED },
      }),
      this.prisma.book.findMany({
        take: 5,
        orderBy: { purchases: { _count: 'desc' } },
        select: {
          id: true,
          title: true,
          _count: { select: { purchases: true, favorites: true } },
        },
      }),
    ]);

    return {
      users,
      activeSubscriptions: activeSubs,
      totalRevenue: revenueAgg._sum.amount ?? 0,
      popularBooks: popular,
    };
  }

  listUsers(page = 1, limit = 50) {
    return this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { subscriptions: true, purchases: true } },
      },
    });
  }

  listPayments(page = 1, limit = 50) {
    return this.prisma.payment.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, name: true } } },
    });
  }

  /** Liste TOUS les livres pour l'admin, peu importe le statut. */
  async listBooks(page = 1, limit = 50) {
    const [items, total] = await Promise.all([
      this.prisma.book.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { chapters: true, purchases: true } } },
      }),
      this.prisma.book.count(),
    ]);
    return { items, total, page, limit };
  }

  async getBook(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { number: 'asc' },
          select: { id: true, number: true, title: true, summary: true },
        },
      },
    });
    if (!book) throw new NotFoundException('Livre introuvable');
    return book;
  }
}

import { Injectable } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

  list(userId: string) {
    return this.prisma.purchase.findMany({
      where: { userId },
      include: { book: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  buy(userId: string, bookId: string, callbackUrl: string) {
    return this.payments.startBookPurchase(userId, bookId, callbackUrl);
  }
}

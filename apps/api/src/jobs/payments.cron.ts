import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class PaymentsCron {
  constructor(private readonly payments: PaymentsService) {}

  /** Toutes les 5 min : marque FAILED les paiements PENDING au-delà du TTL (30 min). */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireStale() {
    await this.payments.expireStalePayments();
  }
}

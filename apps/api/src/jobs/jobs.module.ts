import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsCron } from './payments.cron';
import { SubscriptionsCron } from './subscriptions.cron';

@Module({
  imports: [ScheduleModule.forRoot(), NotificationsModule],
  providers: [SubscriptionsCron, PaymentsCron],
})
export class JobsModule {}

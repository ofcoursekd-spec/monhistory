import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FcmProvider } from './fcm.provider';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, FcmProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}

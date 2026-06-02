import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { ChaptersModule } from './chapters/chapters.module';
import { PagesModule } from './pages/pages.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PurchasesModule } from './purchases/purchases.module';
import { PaymentsModule } from './payments/payments.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ReadingModule } from './reading/reading.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { CommentsModule } from './comments/comments.module';
import { ReactionsModule } from './reactions/reactions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { JobsModule } from './jobs/jobs.module';
import { StorageModule } from './storage/storage.module';
import { PrismaModule } from './prisma/prisma.module';
import { AccessModule } from './access/access.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    StorageModule,
    AccessModule,
    EmailModule,
    AuthModule,
    UsersModule,
    BooksModule,
    ChaptersModule,
    PagesModule,
    SubscriptionsModule,
    PurchasesModule,
    PaymentsModule,
    FavoritesModule,
    ReadingModule,
    AdminModule,
    CommentsModule,
    ReactionsModule,
    NotificationsModule,
    JobsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FcmProvider } from './fcm.provider';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fcm: FcmProvider,
  ) {}

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async notify(userId: string, type: string, title: string, body: string, data?: Record<string, unknown>) {
    const notif = await this.prisma.notification.create({
      data: { userId, type, title, body, data: data as object },
    });
    const devices = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });
    await this.fcm.send(
      devices.map((d) => d.token),
      title,
      body,
      data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
    );
    return notif;
  }

  registerDevice(userId: string, token: string, platform: 'ios' | 'android' | 'web') {
    return this.prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, lastSeenAt: new Date() },
    });
  }

  unregisterDevice(userId: string, token: string) {
    return this.prisma.deviceToken.deleteMany({ where: { userId, token } });
  }
}

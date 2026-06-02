import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReadingService {
  constructor(private readonly prisma: PrismaService) {}

  continueReading(userId: string) {
    return this.prisma.readingProgress.findMany({
      where: { userId, completedAt: null },
      include: {
        chapter: {
          include: { book: { select: { id: true, slug: true, title: true, coverImageUrl: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
  }

  async upsert(userId: string, chapterId: string, lastPage: number, completed: boolean) {
    return this.prisma.readingProgress.upsert({
      where: { userId_chapterId: { userId, chapterId } },
      create: {
        userId,
        chapterId,
        lastPage,
        completedAt: completed ? new Date() : null,
      },
      update: {
        lastPage,
        completedAt: completed ? new Date() : null,
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { ReactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async toggle(userId: string, chapterId: string, type: ReactionType) {
    const existing = await this.prisma.reaction.findUnique({
      where: { userId_chapterId_type: { userId, chapterId, type } },
    });
    if (existing) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
      return { active: false };
    }
    await this.prisma.reaction.create({ data: { userId, chapterId, type } });
    return { active: true };
  }

  async counts(chapterId: string) {
    const rows = await this.prisma.reaction.groupBy({
      by: ['type'],
      where: { chapterId },
      _count: { _all: true },
    });
    return Object.fromEntries(rows.map((r) => [r.type, r._count._all]));
  }
}

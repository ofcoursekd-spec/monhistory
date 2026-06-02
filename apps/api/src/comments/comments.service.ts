import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(chapterId: string, page = 1, limit = 30) {
    return this.prisma.comment.findMany({
      where: { chapterId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  create(userId: string, chapterId: string, content: string) {
    return this.prisma.comment.create({ data: { userId, chapterId, content } });
  }

  async remove(userId: string, role: Role, id: string) {
    const c = await this.prisma.comment.findUnique({ where: { id } });
    if (!c) throw new NotFoundException();
    if (c.userId !== userId && role !== Role.ADMIN) throw new ForbiddenException();
    await this.prisma.comment.delete({ where: { id } });
  }
}

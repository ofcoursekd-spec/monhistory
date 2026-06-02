import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AccessService, ChapterAccess } from '../access/access.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateChapterDto, UpdateChapterDto } from './chapters.dto';

@Injectable()
export class ChaptersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly access: AccessService,
  ) {}

  /**
   * Charge un chapitre avec ses pages filtrées selon l'accès de l'utilisateur.
   * IMPORTANT : la décision d'accès est prise ici, côté serveur — le client
   * ne voit jamais les pages qu'il n'est pas autorisé à lire.
   */
  async findOneForUser(userId: string, id: string) {
    const access = await this.access.resolve(userId, id);
    if (access.kind === 'denied') {
      throw new NotFoundException('Chapitre indisponible'); // 404 plutôt que 403 = moins d'info au client
    }

    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: {
        book: { select: { id: true, title: true, slug: true } },
        pages: { orderBy: { order: 'asc' } },
        _count: { select: { reactions: true, comments: true } },
      },
    });
    if (!chapter) throw new NotFoundException('Chapitre introuvable');

    const totalPages = chapter.pages.length;
    const visiblePages = this.filterPages(chapter.pages, access);

    return {
      ...chapter,
      pages: await Promise.all(
        visiblePages.map(async (p) => ({
          id: p.id,
          order: p.order,
          description: p.description,
          imageUrl: await this.storage.signedUrl(p.imageKey),
        })),
      ),
      coverImageUrl: chapter.coverImageKey
        ? await this.storage.signedUrl(chapter.coverImageKey)
        : null,
      preview: access.kind === 'preview',
      totalPages,
    };
  }

  /**
   * Sélectionne les pages visibles. En mode preview, prend les N premières
   * pages telles qu'ordonnées par `order` ascendant — peu importe la valeur
   * exacte du champ `order` (utile si l'admin a supprimé et re-uploadé).
   * `pages` est déjà trié par order asc côté `findOneForUser`.
   */
  private filterPages<T>(pages: T[], access: ChapterAccess): T[] {
    if (access.kind === 'full') return pages;
    if (access.kind === 'preview') return pages.slice(0, access.previewCount);
    return [];
  }

  async create(dto: CreateChapterDto) {
    try {
      return await this.prisma.chapter.create({ data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Un chapitre avec ce numéro existe déjà pour ce livre');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateChapterDto) {
    await this.ensureExists(id);
    return this.prisma.chapter.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.chapter.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const c = await this.prisma.chapter.findUnique({ where: { id }, select: { id: true } });
    if (!c) throw new NotFoundException('Chapitre introuvable');
  }
}

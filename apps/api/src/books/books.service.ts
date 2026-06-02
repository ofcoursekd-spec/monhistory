import { Injectable, NotFoundException } from '@nestjs/common';
import { BookStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto, ListBooksQuery, UpdateBookDto } from './books.dto';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListBooksQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.BookWhereInput = {
      status: BookStatus.PUBLISHED,
      ...(query.category && { category: query.category }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { author: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: { _count: { select: { chapters: true } } },
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      items: items.map((b) => ({
        id: b.id,
        slug: b.slug,
        title: b.title,
        author: b.author,
        coverImageUrl: b.coverImageUrl,
        category: b.category,
        price: b.price,
        chaptersCount: b._count.chapters,
      })),
      total,
      page,
      limit,
    };
  }

  async findBySlug(slug: string) {
    const book = await this.prisma.book.findUnique({
      where: { slug },
      include: {
        chapters: {
          orderBy: { number: 'asc' },
          select: { id: true, number: true, title: true, summary: true },
        },
      },
    });
    if (!book) throw new NotFoundException('Livre introuvable');
    return book;
  }

  async create(dto: CreateBookDto) {
    const slug = this.slugify(dto.title);
    return this.prisma.book.create({
      data: {
        ...dto,
        slug,
        status: dto.status ?? BookStatus.DRAFT,
        publishedAt: dto.status === BookStatus.PUBLISHED ? new Date() : null,
      },
    });
  }

  async update(id: string, dto: UpdateBookDto) {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundException('Livre introuvable');

    const becomingPublished =
      dto.status === BookStatus.PUBLISHED && book.status !== BookStatus.PUBLISHED;

    return this.prisma.book.update({
      where: { id },
      data: {
        ...dto,
        ...(becomingPublished && { publishedAt: new Date() }),
      },
    });
  }

  async remove(id: string) {
    await this.prisma.book.delete({ where: { id } });
  }

  // Recommandations basiques (section 13). Une V2 IA viendra plus tard.
  async recommendations(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { book: { select: { category: true } } },
    });
    const preferredCategories = [...new Set(favorites.map((f) => f.book.category))];

    const similar = preferredCategories.length
      ? await this.prisma.book.findMany({
          where: { status: BookStatus.PUBLISHED, category: { in: preferredCategories } },
          take: 10,
          orderBy: { publishedAt: 'desc' },
        })
      : [];

    const popular = await this.prisma.book.findMany({
      where: { status: BookStatus.PUBLISHED },
      take: 10,
      orderBy: { purchases: { _count: 'desc' } },
    });

    const newest = await this.prisma.book.findMany({
      where: { status: BookStatus.PUBLISHED },
      take: 10,
      orderBy: { publishedAt: 'desc' },
    });

    return { similar, popular, newest };
  }

  private slugify(input: string): string {
    return (
      input
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || `book-${Date.now()}`
    );
  }
}

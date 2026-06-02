import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePageDto, ReorderPagesDto, UpdatePageDto } from './pages.dto';

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  create(dto: CreatePageDto) {
    return this.prisma.page.create({ data: dto });
  }

  async update(id: string, dto: UpdatePageDto) {
    await this.ensure(id);
    return this.prisma.page.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.page.delete({ where: { id } });
  }

  async reorder(dto: ReorderPagesDto) {
    await this.prisma.$transaction(
      dto.pageIds.map((pageId, idx) =>
        this.prisma.page.update({
          where: { id: pageId },
          data: { order: idx + 1 },
        }),
      ),
    );
  }

  async uploadUrl(key: string) {
    const signed = await this.storage.signedUploadUrl(key);
    return { ...signed, key };
  }

  private async ensure(id: string) {
    const p = await this.prisma.page.findUnique({ where: { id }, select: { id: true } });
    if (!p) throw new NotFoundException('Page introuvable');
  }
}

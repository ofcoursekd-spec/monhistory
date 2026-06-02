import { Body, Controller, Delete, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { Roles } from '../common/decorators';
import { CreatePageDto, ReorderPagesDto, RequestUploadUrlDto, UpdatePageDto } from './pages.dto';
import { PagesService } from './pages.service';

@ApiTags('pages')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('pages')
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  @Post() create(@Body() dto: CreatePageDto) { return this.pages.create(dto); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePageDto) { return this.pages.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseUUIDPipe) id: string) { return this.pages.remove(id); }
  @Post('reorder') reorder(@Body() dto: ReorderPagesDto) { return this.pages.reorder(dto); }
  @Post('upload-url') uploadUrl(@Body() dto: RequestUploadUrlDto) { return this.pages.uploadUrl(dto.key); }
}

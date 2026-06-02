import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { AuthUser, CurrentUser, Roles } from '../common/decorators';
import { ChaptersService } from './chapters.service';
import { CreateChapterDto, UpdateChapterDto } from './chapters.dto';

@ApiTags('chapters')
@ApiBearerAuth()
@Controller('chapters')
export class ChaptersController {
  constructor(private readonly chapters: ChaptersService) {}

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.chapters.findOneForUser(user.id, id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateChapterDto) {
    return this.chapters.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateChapterDto) {
    return this.chapters.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.chapters.remove(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { CurrentUser, AuthUser, Public, Roles } from '../common/decorators';
import { BooksService } from './books.service';
import { CreateBookDto, ListBooksQuery, UpdateBookDto } from './books.dto';

@ApiTags('books')
@ApiBearerAuth()
@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Public()
  @Get()
  list(@Query() q: ListBooksQuery) {
    return this.books.list(q);
  }

  @Public()
  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.books.findBySlug(slug);
  }

  @Get('me/recommendations')
  recommendations(@CurrentUser() user: AuthUser) {
    return this.books.recommendations(user.id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateBookDto) {
    return this.books.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBookDto) {
    return this.books.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.books.remove(id);
  }
}

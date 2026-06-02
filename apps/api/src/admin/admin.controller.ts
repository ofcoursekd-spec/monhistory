import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { Roles } from '../common/decorators';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('kpis') kpis() { return this.admin.kpis(); }

  @Get('users')
  users(@Query('page') page = 1, @Query('limit') limit = 50) {
    return this.admin.listUsers(Number(page), Number(limit));
  }

  @Get('payments')
  payments(@Query('page') page = 1, @Query('limit') limit = 50) {
    return this.admin.listPayments(Number(page), Number(limit));
  }

  @Get('books')
  books(@Query('page') page = 1, @Query('limit') limit = 50) {
    return this.admin.listBooks(Number(page), Number(limit));
  }

  @Get('books/:id')
  book(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.getBook(id);
  }
}

import { Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get() list(@CurrentUser() user: AuthUser) { return this.favorites.list(user.id); }
  @Post(':bookId') add(@CurrentUser() user: AuthUser, @Param('bookId', ParseUUIDPipe) bookId: string) {
    return this.favorites.add(user.id, bookId);
  }
  @Delete(':bookId') remove(@CurrentUser() user: AuthUser, @Param('bookId', ParseUUIDPipe) bookId: string) {
    return this.favorites.remove(user.id, bookId);
  }
}

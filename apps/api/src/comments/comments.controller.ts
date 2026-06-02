import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { AuthUser, CurrentUser, Public } from '../common/decorators';
import { CommentsService } from './comments.service';

class CreateCommentDto {
  @IsString() @IsNotEmpty() @MaxLength(1000) content!: string;
}

@ApiTags('comments')
@ApiBearerAuth()
@Controller('comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Public()
  @Get('chapter/:chapterId')
  list(@Param('chapterId') chapterId: string, @Query('page') page = 1, @Query('limit') limit = 30) {
    return this.comments.list(chapterId, Number(page), Number(limit));
  }

  @Post('chapter/:chapterId')
  create(
    @CurrentUser() user: AuthUser,
    @Param('chapterId') chapterId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.create(user.id, chapterId, dto.content);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.comments.remove(user.id, user.role, id);
  }
}

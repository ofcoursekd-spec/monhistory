import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReactionType } from '@prisma/client';
import { IsEnum } from 'class-validator';

import { AuthUser, CurrentUser, Public } from '../common/decorators';
import { ReactionsService } from './reactions.service';

class ToggleDto {
  @IsEnum(ReactionType) type!: ReactionType;
}

@ApiTags('reactions')
@ApiBearerAuth()
@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactions: ReactionsService) {}

  @Public()
  @Get('chapter/:chapterId/counts')
  counts(@Param('chapterId') chapterId: string) {
    return this.reactions.counts(chapterId);
  }

  @Post('chapter/:chapterId/toggle')
  toggle(
    @CurrentUser() user: AuthUser,
    @Param('chapterId') chapterId: string,
    @Body() dto: ToggleDto,
  ) {
    return this.reactions.toggle(user.id, chapterId, dto.type);
  }
}

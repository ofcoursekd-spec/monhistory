import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

import { AuthUser, CurrentUser } from '../common/decorators';
import { ReadingService } from './reading.service';

class ProgressDto {
  @IsUUID() chapterId!: string;
  @IsInt() @Min(1) lastPage!: number;
  @IsOptional() @IsBoolean() completed?: boolean;
}

@ApiTags('reading')
@ApiBearerAuth()
@Controller('reading')
export class ReadingController {
  constructor(private readonly reading: ReadingService) {}

  @Get('continue')
  continueReading(@CurrentUser() user: AuthUser) {
    return this.reading.continueReading(user.id);
  }

  @Post('progress')
  progress(@CurrentUser() user: AuthUser, @Body() dto: ProgressDto) {
    return this.reading.upsert(user.id, dto.chapterId, dto.lastPage, dto.completed ?? false);
  }
}

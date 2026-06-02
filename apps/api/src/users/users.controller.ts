import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

import { AuthUser, CurrentUser } from '../common/decorators';
import { UsersService } from './users.service';

class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsUrl({ require_tld: false }) avatarUrl?: string;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me') me(@CurrentUser() user: AuthUser) { return this.users.me(user.id); }

  @Patch('me')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }
}

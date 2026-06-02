import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

import { AuthUser, CurrentUser } from '../common/decorators';
import { NotificationsService } from './notifications.service';

class RegisterDeviceDto {
  @IsString() token!: string;
  @IsIn(['ios', 'android', 'web']) platform!: 'ios' | 'android' | 'web';
}

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get() list(@CurrentUser() user: AuthUser) { return this.notifications.list(user.id); }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Post('devices')
  register(@CurrentUser() user: AuthUser, @Body() dto: RegisterDeviceDto) {
    return this.notifications.registerDevice(user.id, dto.token, dto.platform);
  }

  @Delete('devices/:token')
  unregister(@CurrentUser() user: AuthUser, @Param('token') token: string) {
    return this.notifications.unregisterDevice(user.id, token);
  }
}

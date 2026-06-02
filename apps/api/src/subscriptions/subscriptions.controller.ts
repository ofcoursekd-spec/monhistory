import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

import { AuthUser, CurrentUser, Public } from '../common/decorators';
import { SubscriptionsService } from './subscriptions.service';

class SubscribeDto {
  @IsString() @IsNotEmpty() planCode!: string;
  @IsUrl({ require_tld: false }) callbackUrl!: string;
}

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subs: SubscriptionsService) {}

  @Public()
  @Get('plans')
  plans() {
    return this.subs.listPlans();
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.subs.myStatus(user.id);
  }

  /** Rate limit serré : 5 tentatives d'abonnement par minute / IP, anti-abus. */
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post()
  subscribe(@CurrentUser() user: AuthUser, @Body() dto: SubscribeDto) {
    return this.subs.subscribe(user.id, dto.planCode, dto.callbackUrl);
  }

  @Delete(':id')
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.subs.cancel(user.id, id);
  }
}

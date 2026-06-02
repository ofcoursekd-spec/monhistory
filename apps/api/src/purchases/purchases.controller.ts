import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

import { AuthUser, CurrentUser } from '../common/decorators';
import { PurchasesService } from './purchases.service';

class BuyDto {
  @IsUUID() bookId!: string;
  @IsString() callbackUrl!: string;
}

@ApiTags('purchases')
@ApiBearerAuth()
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchases: PurchasesService) {}

  @Get() list(@CurrentUser() user: AuthUser) { return this.purchases.list(user.id); }

  @Post()
  buy(@CurrentUser() user: AuthUser, @Body() dto: BuyDto) {
    return this.purchases.buy(user.id, dto.bookId, dto.callbackUrl);
  }
}

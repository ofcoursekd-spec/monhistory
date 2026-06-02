import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Request } from 'express';

import { Public } from '../common/decorators';
import { PaymentsService } from './payments.service';

/** Données métier dans un webhook GeniusPay. */
class GeniusPayWebhookDataDto {
  @IsString() reference!: string; // "MTX-..."
  @IsNumber() amount!: number;
  @IsString() currency!: string;
  @IsString() status!: string;
  @IsOptional() @IsString() payment_method?: string;
  @IsOptional() @IsNumber() fees?: number;
  @IsOptional() @IsNumber() net_amount?: number;
  @IsOptional() @IsString() customer_name?: string;
  @IsOptional() @IsString() customer_phone?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

/** Enveloppe d'événement webhook GeniusPay (cf. doc officielle). */
class GeniusPayWebhookDto {
  @IsString() id!: string; // evt_...
  @IsString() event!: string; // "payment.success" | "payment.failed" | ...
  @IsOptional() @IsNumber() timestamp?: number;
  @IsOptional() @IsString() environment?: string;
  @ValidateNested()
  @Type(() => GeniusPayWebhookDataDto)
  data!: GeniusPayWebhookDataDto;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @SkipThrottle()
  @HttpCode(200)
  @Post('webhooks/geniuspay')
  async webhook(
    @Req() req: Request,
    @Headers('x-webhook-signature') signature: string,
    @Headers('x-webhook-timestamp') timestamp: string,
    @Body() body: GeniusPayWebhookDto,
  ) {
    const raw = (req as Request & { rawBody?: string }).rawBody;
    if (!raw) throw new BadRequestException('Raw body absent — middleware mal configuré');
    await this.payments.handleGeniusPayWebhook(raw, signature, timestamp, body);
    return { received: true };
  }
}

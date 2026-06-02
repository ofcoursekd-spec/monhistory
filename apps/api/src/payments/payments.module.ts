import { Global, Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { GeniusPayProvider } from './providers/geniuspay.provider';

@Global()
@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, GeniusPayProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}

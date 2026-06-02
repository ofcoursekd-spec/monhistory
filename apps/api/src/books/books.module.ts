import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

@Module({
  imports: [AccessModule],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}

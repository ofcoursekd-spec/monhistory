import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { BookStatus, Category } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateBookDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @IsNotEmpty() description!: string;
  @IsString() @IsNotEmpty() author!: string;
  @IsUrl({ require_tld: false }) coverImageUrl!: string;
  @IsEnum(Category) category!: Category;
  @IsInt() @Min(0) price!: number;
  @ApiPropertyOptional({ enum: BookStatus })
  @IsOptional() @IsEnum(BookStatus) status?: BookStatus;
}

export class UpdateBookDto extends PartialType(CreateBookDto) {}

export class ListBooksQuery {
  @ApiPropertyOptional({ enum: Category })
  @IsOptional() @IsEnum(Category) category?: Category;

  @ApiPropertyOptional()
  @IsOptional() @IsString() search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @IsInt() @Min(1) page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @IsInt() @Min(1) limit?: number = 20;
}

export class BookSummary {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() title!: string;
  @ApiProperty() author!: string;
  @ApiProperty() coverImageUrl!: string;
  @ApiProperty({ enum: Category }) category!: Category;
  @ApiProperty() price!: number;
  @ApiProperty() chaptersCount!: number;
}

import { PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateChapterDto {
  @IsUUID() bookId!: string;
  @IsInt() @Min(1) number!: number;
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() coverImageKey?: string;
}

export class UpdateChapterDto extends PartialType(CreateChapterDto) {}

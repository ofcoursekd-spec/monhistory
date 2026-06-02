import { PartialType } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

export class CreatePageDto {
  @IsUUID() chapterId!: string;
  @IsInt() @Min(1) order!: number;
  @IsString() @IsNotEmpty() imageKey!: string;
  @IsOptional() @IsString() description?: string;
}

export class UpdatePageDto extends PartialType(CreatePageDto) {}

export class ReorderPagesDto {
  @IsUUID() chapterId!: string;
  // Drag & drop admin : liste des IDs de pages dans l'ordre voulu.
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  pageIds!: string[];
}

export class RequestUploadUrlDto {
  // On contraint la clé à un préfixe `livres/` pour éviter qu'un admin
  // (compromis ou maladroit) écrase des fichiers hors arborescence.
  // Ex valide : "livres/mon-slug/c1/1700000000-page.webp"
  @IsString()
  @IsNotEmpty()
  @Matches(/^livres\/[a-z0-9._-]+\/c[0-9]+\/[a-z0-9._-]+\.(webp|png|jpg|jpeg)$/i, {
    message:
      'La clé doit suivre le format "livres/<slug>/c<num>/<fichier>.{webp|png|jpg|jpeg}"',
  })
  key!: string;

  @IsOptional() @IsString() contentType?: string;
}

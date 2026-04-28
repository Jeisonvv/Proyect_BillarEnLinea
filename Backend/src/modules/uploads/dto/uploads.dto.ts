import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class UploadImageDto {
  @IsOptional()
  @Transform(({ value }) => normalizeString(value))
  @IsString()
  @MaxLength(120)
  folder?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeString(value))
  @IsString()
  @MaxLength(160)
  publicId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return value;

    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    return value;
  })
  @IsBoolean()
  overwrite?: boolean;

  @IsOptional()
  @Transform(({ value }) => normalizeString(value))
  @IsString()
  @MaxLength(300)
  tags?: string;
}
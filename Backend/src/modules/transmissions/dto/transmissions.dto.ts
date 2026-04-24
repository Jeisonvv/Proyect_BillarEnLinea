import { IsOptional, IsString } from 'class-validator';

export class CreateTransmissionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  [key: string]: unknown;
}

export class UpdateTransmissionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  [key: string]: unknown;
}
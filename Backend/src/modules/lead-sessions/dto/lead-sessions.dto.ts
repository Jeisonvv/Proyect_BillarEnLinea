import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class EnsureLeadSessionDto {
  @IsString()
  @IsNotEmpty()
  channel!: string;

  @IsString()
  @IsNotEmpty()
  providerId!: string;

  @IsOptional()
  @IsString()
  currentState?: string;

  @IsOptional()
  @IsObject()
  stateData?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  leadData?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  qualified?: boolean;

  @IsOptional()
  @IsString()
  persistedUserId?: string;
}

export class UpdateLeadSessionStateDto {
  @IsString()
  @IsNotEmpty()
  currentState!: string;

  @IsOptional()
  @IsObject()
  stateData?: Record<string, unknown>;
}

export class UpdateLeadSessionDataDto {
  @IsOptional()
  @IsObject()
  leadData?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  qualified?: boolean;

  @IsOptional()
  @IsString()
  status?: string;
}
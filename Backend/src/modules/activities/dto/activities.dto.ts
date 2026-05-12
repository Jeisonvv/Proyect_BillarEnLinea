import { IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Channel } from '../../../models/enums.js';

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsString()
  @IsNotEmpty()
  prize!: string;

  @IsOptional()
  @IsString()
  prizeImageUrl?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsNumber()
  @Min(0)
  ticketPrice!: number;

  @IsInt()
  @Min(10)
  totalTickets!: number;

  @IsDateString()
  drawDate!: string;

  [key: string]: unknown;
}

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  prize?: string;

  @IsOptional()
  @IsString()
  prizeImageUrl?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ticketPrice?: number;

  @IsOptional()
  @IsDateString()
  drawDate?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class ListActivitiesQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

export class ListActivityNumbersQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

export class PurchaseActivityTicketsDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsArray()
  numbers?: Array<string | number>;

  @IsOptional()
  @IsEnum(Channel)
  channel?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateActivityCheckoutDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsArray()
  @IsNotEmpty({ each: true })
  numbers!: Array<string | number>;

  @IsOptional()
  @IsEnum(Channel)
  channel?: string;
}

export class DrawActivityDto {
  @IsNotEmpty()
  @IsString()
  winningNumber!: string;
}
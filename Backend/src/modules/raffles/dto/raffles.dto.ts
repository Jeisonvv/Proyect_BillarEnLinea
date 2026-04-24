import { IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Channel } from '../../../models/enums.js';

export class CreateRaffleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  prize!: string;

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

export class ListRafflesQueryDto {
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

export class ListRaffleNumbersQueryDto {
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

export class PurchaseRaffleTicketsDto {
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

export class CreateRaffleCheckoutDto {
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

export class DrawRaffleDto {
  @IsNotEmpty()
  @IsString()
  winningNumber!: string;
}
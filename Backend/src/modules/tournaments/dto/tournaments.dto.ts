import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { TournamentFormat, TournamentStatus } from '../../../models/enums.js';

export class TournamentPrizeDto {
  @IsInt()
  @Min(1)
  position!: number;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}

export class TournamentGroupStageSlotDto {
  @IsDateString()
  date!: string;

  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @IsOptional()
  @IsString()
  endTime!: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class CreateTournamentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  formatDetails?: string;

  @IsOptional()
  @IsEnum(TournamentFormat)
  format?: string;

  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedCategories?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  currentParticipants?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @IsOptional()
  @IsDateString()
  discount20Deadline?: string;

  @IsOptional()
  @IsDateString()
  discount10Deadline?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  entryFee?: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  maxParticipants?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TournamentPrizeDto)
  prizes?: TournamentPrizeDto[];

  @IsOptional()
  @IsString()
  venueName?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  streamUrl?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

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
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(3)
  playersPerGroup?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  groupStageTables?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TournamentGroupStageSlotDto)
  groupStageSlots?: TournamentGroupStageSlotDto[];

  @IsOptional()
  @IsBoolean()
  withHandicap?: boolean;

  @IsOptional()
  @IsMongoId()
  createdBy?: string;

  [key: string]: unknown;
}

export class ListTournamentsQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

export class RegisterTournamentPlayerDto {
  @IsMongoId()
  userId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  handicap?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  playerCategory?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsMongoId()
  groupStageSlotId?: string;
}

export class SelfRegisterTournamentDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  handicap?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  playerCategory?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsMongoId()
  groupStageSlotId?: string;
}

export class CreateTournamentCheckoutDto {
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  playerCategory?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  handicap?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsMongoId()
  groupStageSlotId?: string;
}

export class UpdateTournamentHandicapDto {
  @IsNumber()
  @Min(0)
  handicap!: number;
}

export class TournamentGroupInputDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  players!: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  tableNumber?: number;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  advanceCount?: number;
}

export class CreateTournamentGroupsDto {
  @IsArray()
  @ArrayNotEmpty()
  groups!: TournamentGroupInputDto[];
}

export class AddTournamentPlayerToGroupDto {
  @IsMongoId()
  userId!: string;
}

export class AutoCreateTournamentGroupsDto {
  @IsOptional()
  @IsInt()
  @Min(2)
  playersPerGroup?: number;
}
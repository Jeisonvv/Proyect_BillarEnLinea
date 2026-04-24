import { ArrayNotEmpty, IsArray, IsBoolean, IsDateString, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTournamentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  entryFee?: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  maxParticipants?: number;

  @IsOptional()
  @IsBoolean()
  withHandicap?: boolean;

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
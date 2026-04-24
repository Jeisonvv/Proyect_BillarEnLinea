import { IsNumber, Min } from 'class-validator';

export class RecordMatchResultDto {
  @IsNumber()
  @Min(0)
  score1!: number;

  @IsNumber()
  @Min(0)
  score2!: number;
}
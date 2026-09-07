import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateDailyReportItemDto {
  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  taskId?: string;

  @IsString()
  @IsOptional()
  workDone?: string;

  @IsString()
  @IsOptional()
  workResult?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progressBefore?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progressAfter?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  workingHours?: number;

  @IsBoolean()
  @IsOptional()
  hasBlocker?: boolean;

  @IsString()
  @IsOptional()
  blockerDescription?: string;
}

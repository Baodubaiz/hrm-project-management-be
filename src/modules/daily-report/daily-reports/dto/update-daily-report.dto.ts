import { DailyReportStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateDailyReportDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  reportDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  submittedAt?: Date;

  @IsString()
  @IsOptional()
  overallNote?: string;

  @IsString()
  @IsOptional()
  tomorrowPlan?: string;

  @IsEnum(DailyReportStatus)
  @IsOptional()
  status?: DailyReportStatus;
}

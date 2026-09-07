import { DailyReportStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDailyReportDto {
  @IsString()
  @IsNotEmpty({ message: 'employeeId không được để trống' })
  employeeId: string;

  @Type(() => Date)
  @IsDate({ message: 'reportDate không đúng định dạng Date' })
  @IsNotEmpty({ message: 'reportDate không được để trống' })
  reportDate: Date;

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
  status?: DailyReportStatus = DailyReportStatus.DRAFT;
}

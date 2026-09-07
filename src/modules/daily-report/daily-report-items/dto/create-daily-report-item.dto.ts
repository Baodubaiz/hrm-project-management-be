import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateDailyReportItemDto {
  @IsString()
  @IsNotEmpty({ message: 'dailyReportId không được để trống' })
  dailyReportId: string;

  @IsString()
  @IsNotEmpty({ message: 'projectId không được để trống' })
  projectId: string;

  @IsString()
  @IsOptional()
  taskId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung công việc (workDone) không được để trống' })
  workDone: string;

  @IsString()
  @IsOptional()
  workResult?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progressBefore?: number = 0;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progressAfter?: number = 0;

  @IsNumber()
  @Min(0, { message: 'Số giờ làm việc phải >= 0' })
  @IsNotEmpty({ message: 'Số giờ làm việc không được để trống' })
  workingHours: number;

  @IsBoolean()
  @IsOptional()
  hasBlocker?: boolean = false;

  @IsString()
  @IsOptional()
  blockerDescription?: string;
}
